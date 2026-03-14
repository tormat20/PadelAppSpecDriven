/**
 * Booking system text/HTML parser.
 *
 * Parses participant lists copy-pasted from Swedish booking systems (Matchi
 * and similar). Each participant block looks like:
 *
 *   Karim Chawqui                         ← optional standalone name line (bold in source)
 *   Karim Chawquikarimski@hotmail.com      ← name jammed directly against email
 *   Gick med 2026-03-05                   ← boilerplate — discard
 *   Konto-/kreditkort                     ← boilerplate — discard
 *
 * Two parsing strategies are provided:
 *   1. parseBookingHtml  — primary: reads `text/html` clipboard data; exploits
 *                          bold tags to unambiguously identify names.
 *   2. parseBookingText  — fallback: reads `text/plain` clipboard data; uses
 *                          email-regex splitting and context from the prior line.
 */

export type ParsedParticipant = {
  /** Display name extracted from the booking list. */
  name: string
  /** Email address extracted from the booking list. */
  email: string
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Lines that are pure boilerplate and carry no participant data. */
const BOILERPLATE_RE =
  /^(Tillfället är fulltecknat|Gick med |Konto-\/kreditkort|Klippkort)\s*/i

function isBoilerplate(line: string): boolean {
  return BOILERPLATE_RE.test(line.trim())
}

/**
 * Given a "jammed" string segment (the portion of a line from the last space
 * to the `@` symbol), find where the email local-part starts.
 *
 * The booking system concatenates the name's last word directly against the
 * email local-part with no separator.  The heuristic (ordered by priority):
 *
 * 1. **Digit**: if a digit appears anywhere in the segment, the email starts
 *    at the first digit (Apple relay addresses and other alphanumeric emails).
 * 2. **Non-ASCII boundary**: if the segment contains non-ASCII characters
 *    (Swedish ö, å, ä…), the email starts right after the last non-ASCII char
 *    (since email local-parts are ASCII-only).
 * 3. **Repetition**: for all-ASCII segments, the last name word often appears
 *    (case-insensitively) both at the start of the segment *and* somewhere
 *    inside the email local-part.  We find the longest prefix of the lowercase
 *    segment that also occurs at a later position; the email starts at the end
 *    of that prefix.
 * 4. **Fallback**: return the entire segment (best effort).
 *
 * Returns the email local-part string.
 */
function extractEmailLocalFromJammed(jammed: string): string {
  // 1. Digit boundary
  const digitIdx = jammed.search(/[0-9]/)
  if (digitIdx >= 0) return jammed.slice(digitIdx)

  // 2. Non-ASCII boundary
  let lastNonAscii = -1
  for (let i = 0; i < jammed.length; i++) {
    if (jammed.charCodeAt(i) > 127) lastNonAscii = i
  }
  if (lastNonAscii >= 0) return jammed.slice(lastNonAscii + 1)

  // 3. Repetition detection (all-ASCII)
  const lower = jammed.toLowerCase()
  for (let wordLen = lower.length - 1; wordLen >= 1; wordLen--) {
    const prefix = lower.slice(0, wordLen)
    if (lower.indexOf(prefix, wordLen) >= 0) {
      return jammed.slice(wordLen)
    }
  }

  // 4. Fallback
  return jammed
}

/**
 * Extract { email, localStartIdx } from a line that may have a jammed
 * name+email or a standalone email.
 *
 * If `prevLine` is provided and is a prefix of `line`, strip it first so
 * the email search operates only on the remainder.
 */
function findEmailInLine(
  line: string,
  prevLine: string,
): { email: string; name: string } | null {
  const atIdx = line.indexOf("@")
  if (atIdx < 0) return null

  // --- Case 1: prevLine is a prefix of the current line ---
  if (prevLine && line.startsWith(prevLine)) {
    const remainder = line.slice(prevLine.length)
    const remAtIdx = remainder.indexOf("@")
    if (remAtIdx < 0) return null

    // Scan back from @ in remainder to collect the local-part
    const LOCAL_CHAR = /[a-zA-Z0-9._%+\-]/
    let start = remAtIdx - 1
    while (start > 0 && LOCAL_CHAR.test(remainder[start - 1])) start--
    const local = remainder.slice(start, remAtIdx)
    if (!local) return null

    const domain = extractDomain(remainder, remAtIdx)
    if (!domain) return null

    return { email: local + "@" + domain, name: prevLine }
  }

  // --- Case 2: no prevLine context — infer from the jammed segment ---
  // Isolate the text before @.
  const beforeAt = line.slice(0, atIdx)

  // The last-space segment is the jammed {last_name_word}{email_local}.
  const lastSpaceIdx = beforeAt.lastIndexOf(" ")
  const jammed = beforeAt.slice(lastSpaceIdx + 1)

  const emailLocal = extractEmailLocalFromJammed(jammed)
  if (!emailLocal) return null

  const domain = extractDomain(line, atIdx)
  if (!domain) return null

  // The name is everything before the email local-part on this line.
  const emailStartInLine = atIdx - emailLocal.length
  const name = line.slice(0, emailStartInLine).trim()
  if (!name) return null

  return { email: emailLocal + "@" + domain, name }
}

/** Extract domain starting right after `@` at position `atIdx`. */
function extractDomain(s: string, atIdx: number): string | null {
  const DOMAIN_CHAR = /[a-zA-Z0-9.\-]/
  let end = atIdx + 1
  while (end < s.length && DOMAIN_CHAR.test(s[end])) end++
  const domain = s.slice(atIdx + 1, end).replace(/[.\-]+$/, "")
  return domain.includes(".") ? domain : null
}

// ---------------------------------------------------------------------------
// Plain-text parser (fallback)
// ---------------------------------------------------------------------------

/**
 * Parses a plain-text copy-paste from the booking system.
 *
 * Algorithm:
 *  1. Split into lines, skip empty lines and boilerplate.
 *  2. For each line containing an `@`:
 *     a. Use `findEmailInLine` with the previous non-boilerplate line as context.
 *     b. Deduplicate by lowercase email.
 *  3. Lines without `@` are stored as the candidate standalone name line.
 */
export function parseBookingText(rawText: string): ParsedParticipant[] {
  const lines = rawText.split("\n").map((l) => l.trim())

  const seen = new Set<string>()
  const results: ParsedParticipant[] = []

  let prevCleanLine = ""

  for (const line of lines) {
    if (!line) {
      // Blank line resets the "previous name" context
      prevCleanLine = ""
      continue
    }
    if (isBoilerplate(line)) continue

    if (!line.includes("@")) {
      // No email on this line — treat as candidate standalone name
      prevCleanLine = line
      continue
    }

    const found = findEmailInLine(line, prevCleanLine)
    if (!found) {
      prevCleanLine = ""
      continue
    }

    const emailKey = found.email.toLowerCase()
    if (seen.has(emailKey)) {
      prevCleanLine = ""
      continue
    }

    seen.add(emailKey)
    results.push({ name: found.name, email: found.email })
    prevCleanLine = ""
  }

  return results
}

// ---------------------------------------------------------------------------
// HTML parser (primary — works in browser and Node/test environments)
// ---------------------------------------------------------------------------

/**
 * Parses the `text/html` clipboard payload from the booking system.
 *
 * Strategy (regex-based, works without DOMParser):
 *  1. Find all `<b>` and `<strong>` elements — these are the participant names.
 *  2. For each bold element, look at the text following the closing tag and
 *     extract an email using `findEmail`.
 *  3. Deduplicate by lowercase email.
 *
 * Uses a lookahead `(?=[\s>])` after the tag name to avoid matching `<br>`,
 * `<body>`, etc. as bold elements.
 */
export function parseBookingHtml(html: string): ParsedParticipant[] {
  const seen = new Set<string>()
  const results: ParsedParticipant[] = []

  // Require the tag name to be exactly "b" or "strong" (not "br", "body", etc.)
  const BOLD_RE = /<(b|strong)(?=[\s>])[^>]*>([\s\S]*?)<\/\1>/gi

  let match: RegExpExecArray | null
  while ((match = BOLD_RE.exec(html)) !== null) {
    const name = stripTags(match[2]).trim()
    if (!name || isBoilerplate(name)) continue

    // Text immediately following this closing tag (up to 300 chars ahead).
    const afterTagStart = match.index + match[0].length
    const afterText = stripTags(html.slice(afterTagStart, afterTagStart + 300))

    const atIdx = afterText.indexOf("@")
    if (atIdx < 0) continue

    // Collect local-part by scanning backward from @
    const LOCAL_CHAR = /[a-zA-Z0-9._%+\-]/
    let start = atIdx - 1
    while (start > 0 && LOCAL_CHAR.test(afterText[start - 1])) start--
    const local = afterText.slice(start, atIdx)
    if (!local) continue

    const domain = extractDomain(afterText, atIdx)
    if (!domain) continue

    const email = local + "@" + domain
    const emailKey = email.toLowerCase()
    if (seen.has(emailKey)) continue

    seen.add(emailKey)
    results.push({ name, email })
  }

  return results
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Remove all HTML tags from a string, leaving plain text. */
function stripTags(html: string): string {
  // Replace tags with a space so adjacent words don't run together
  // (e.g. "gmail.com<br>Gick" → "gmail.com Gick" rather than "gmail.comGick").
  return html.replace(/<[^>]+>/g, " ")
}
