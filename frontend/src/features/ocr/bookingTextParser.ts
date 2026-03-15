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
 * email local-part with no separator.  `wordsFromLine` provides the other
 * words on the same line (before the jammed word) as hints for name-word
 * boundary detection.
 *
 * Heuristics applied in order of priority:
 *
 * 1. **Non-ASCII boundary**: if the segment contains non-ASCII characters
 *    (Swedish ö, å, ä…), the email starts right after the last non-ASCII char.
 *    The ASCII remainder is further narrowed by repetition (min 4 chars) and
 *    name-word search before being returned.
 * 2. **All-caps-to-lowercase boundary**: a run of 2+ uppercase letters
 *    followed immediately by a lowercase letter signals an ALL-CAPS name suffix
 *    jammed against a lowercase email (e.g. "NYBORGtanming7" → "tanming7").
 * 3. **Repetition** (min 4 chars): the last name word often appears both at
 *    the start of the jammed segment *and* somewhere inside the email local;
 *    the longest such prefix (≥ 4 chars) is used as the name portion.
 * 4. **Name-word boundary**: look for any word from `wordsFromLine` (or a
 *    prefix ≥ 3 chars) occurring inside the jammed segment; the email starts
 *    at that occurrence.
 * 5. **Digit boundary**: the email starts at the first digit (Apple relay
 *    addresses and other purely alphanumeric email locals).
 * 6. **Fallback**: return the entire segment.
 *
 * Returns the email local-part string.
 */

/** Minimum prefix length for the repetition heuristic. */
const MIN_REPETITION_LEN = 4

/**
 * Search `s` for any word in `wordsFromLine` (full match, then prefix ≥ 3)
 * starting from index 1 (never the very beginning).  Returns the slice of `s`
 * from the first match position, or `null` if no match found.
 */
function nameWordSearch(s: string, wordsFromLine: string[]): string | null {
  const ls = s.toLowerCase()
  // Full word match
  for (const word of wordsFromLine) {
    if (word.length < 2) continue
    const wl = word.toLowerCase()
    const idx = ls.indexOf(wl, 1)
    if (idx > 0) return s.slice(idx)
  }
  // Prefix match (longest first, minimum 3 chars)
  const maxWordLen = wordsFromLine.reduce((m, w) => Math.max(m, w.length), 0)
  for (let prefixLen = maxWordLen; prefixLen >= 3; prefixLen--) {
    for (const word of wordsFromLine) {
      const wl = word.toLowerCase()
      if (prefixLen >= wl.length) continue
      const pfx = wl.slice(0, prefixLen)
      const idx = ls.indexOf(pfx, 1)
      if (idx > 0) return s.slice(idx)
    }
  }
  return null
}

function extractEmailLocalFromJammed(jammed: string, wordsFromLine: string[]): string {
  // 1. Non-ASCII boundary
  let lastNonAscii = -1
  for (let i = 0; i < jammed.length; i++) {
    if (jammed.charCodeAt(i) > 127) lastNonAscii = i
  }
  if (lastNonAscii >= 0) {
    const afterNonAscii = jammed.slice(lastNonAscii + 1)
    const lower = afterNonAscii.toLowerCase()
    // Try repetition on the ASCII remainder
    for (let wordLen = lower.length - 1; wordLen >= MIN_REPETITION_LEN; wordLen--) {
      const prefix = lower.slice(0, wordLen)
      if (lower.indexOf(prefix, wordLen) >= 0) return afterNonAscii.slice(wordLen)
    }
    // Try name-word search on the ASCII remainder
    const nwAfter = nameWordSearch(afterNonAscii, wordsFromLine)
    if (nwAfter) return nwAfter
    // Return full ASCII remainder (name was entirely before the non-ASCII char)
    return afterNonAscii
  }

  // 2. All-caps-to-lowercase boundary (requires 2+ uppercase chars before lowercase)
  for (let i = 2; i < jammed.length; i++) {
    const curr = jammed[i]
    if (curr >= "a" && curr <= "z") {
      const prefix = jammed.slice(0, i)
      if (/^[A-Z]{2,}$/.test(prefix)) return jammed.slice(i)
    }
  }

  // 3. Repetition heuristic (min 4 chars)
  const lower = jammed.toLowerCase()
  for (let wordLen = lower.length - 1; wordLen >= MIN_REPETITION_LEN; wordLen--) {
    const prefix = lower.slice(0, wordLen)
    if (lower.indexOf(prefix, wordLen) >= 0) return jammed.slice(wordLen)
  }

  // 4. Name-word boundary
  const nw = nameWordSearch(jammed, wordsFromLine)
  if (nw) return nw

  // 5. Digit boundary
  const digitIdx = jammed.search(/[0-9]/)
  if (digitIdx >= 0) return jammed.slice(digitIdx)

  // 6. Fallback
  return jammed
}

/**
 * Extract { email, name } from a line that may have a jammed name+email or a
 * standalone email.
 *
 * If `prevLine` is provided and is a **case-insensitive prefix** of `line`,
 * strip it first so the email search operates only on the remainder (Case 1).
 * Otherwise infer both name and email from the jammed segment (Case 2).
 */
function findEmailInLine(
  line: string,
  prevLine: string,
): { email: string; name: string } | null {
  const atIdx = line.indexOf("@")
  if (atIdx < 0) return null

  // --- Case 1: prevLine is a case-insensitive prefix of the current line ---
  if (prevLine && line.toLowerCase().startsWith(prevLine.toLowerCase())) {
    const remainder = line.slice(prevLine.length)
    const remAtIdx = remainder.indexOf("@")
    if (remAtIdx < 0) return null

    // Examine what sits immediately before the @ in the remainder.
    const beforeAt = remainder.slice(0, remAtIdx).trim()
    const remWords = beforeAt.split(/\s+/).filter(Boolean)
    const lastWord = remWords[remWords.length - 1] ?? ""

    let emailLocal: string
    if (!lastWord || /^[a-z0-9]/.test(lastWord)) {
      // The text before @ is already a valid email local (starts lowercase/digit).
      // Scan back from @ to collect it.
      const LOCAL_CHAR = /[a-zA-Z0-9._%+\-]/
      let start = remAtIdx - 1
      while (start > 0 && LOCAL_CHAR.test(remainder[start - 1])) start--
      emailLocal = remainder.slice(start, remAtIdx)
    } else {
      // The last word before @ starts with uppercase — a name word is jammed
      // directly against the email local (e.g. "ZHANG NYBORGtanming7").
      const extraWords = remWords.slice(0, -1)
      const prevLineWords = prevLine.trim().split(/\s+/).filter(Boolean)
      emailLocal = extractEmailLocalFromJammed(lastWord, [
        ...extraWords,
        ...prevLineWords,
      ])
    }

    if (!emailLocal) return null
    const domain = extractDomain(remainder, remAtIdx)
    if (!domain) return null
    return { email: emailLocal + "@" + domain, name: prevLine }
  }

  // --- Case 2: no matching prevLine context — infer from the jammed segment ---
  const beforeAt = line.slice(0, atIdx)
  const allWords = beforeAt.split(/\s+/).filter(Boolean)
  const lastSpaceIdx = beforeAt.lastIndexOf(" ")
  const jammed = beforeAt.slice(lastSpaceIdx + 1)
  const wordsFromLine = allWords.slice(0, -1)

  const emailLocal = extractEmailLocalFromJammed(jammed, wordsFromLine)
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
