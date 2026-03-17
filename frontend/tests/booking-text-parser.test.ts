import { describe, it, expect } from "vitest"
import { parseBookingText, parseBookingHtml } from "../src/features/ocr/bookingTextParser"

// ---------------------------------------------------------------------------
// Plain-text parser tests
// ---------------------------------------------------------------------------

describe("parseBookingText", () => {
  it("extracts name and email from the two-line format", () => {
    const input = [
      "Karim Chawqui",
      "Karim Chawquikarimski@hotmail.com",
      "Gick med 2026-03-05",
      "Konto-/kreditkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Karim Chawqui")
    expect(result[0].email).toBe("karimski@hotmail.com")
  })

  it("extracts name and email from the single-line format (no separate name line)", () => {
    const input = [
      "Mohammad Shirviehpourshirvieh@gmail.com",
      "Gick med 2026-03-05",
      "Konto-/kreditkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe("pourshirvieh@gmail.com")
  })

  it("handles multiple participants", () => {
    const input = [
      "Staffan Hagström",
      "Staffan Hagströmhagstrom.staffan@gmail.com",
      "Gick med 2026-03-05",
      "Konto-/kreditkort",
      "",
      "Andreas Ljungberg",
      "Andreas Ljungbergandreaslljungberg@gmail.com",
      "Gick med 2026-03-05",
      "Konto-/kreditkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" })
    expect(result[1]).toEqual({ name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" })
  })

  it("skips boilerplate lines", () => {
    const input = [
      "Tillfället är fulltecknat",
      "",
      "Peter Dahlkvist",
      "Peter Dahlkvistpeter@skaplig.se",
      "Gick med 2026-03-03",
      "Klippkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Peter Dahlkvist")
    expect(result[0].email).toBe("peter@skaplig.se")
  })

  it("handles Apple relay / private email addresses", () => {
    const input = [
      "Mehdi Shirvieh79j55s2fhh@privaterelay.appleid.com",
      "Gick med 2026-03-04",
      "Konto-/kreditkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe("79j55s2fhh@privaterelay.appleid.com")
  })

  it("deduplicates by email", () => {
    const input = [
      "Alice Smith",
      "Alice Smithalice@example.com",
      "Gick med 2026-03-01",
      "Konto-/kreditkort",
      "",
      "Alice Smith",
      "Alice Smithalice@example.com",
      "Gick med 2026-03-01",
      "Konto-/kreditkort",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
  })

  it("handles all 24 participants from a real-world Matchi booking export", () => {
    const input = `Tillfället är fulltecknat
Karim Chawqui
Karim Chawquikarimski@hotmail.com
Gick med 2026-03-05
Konto-/kreditkort

Staffan Hagström
Staffan Hagströmhagstrom.staffan@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

Andreas Ljungberg
Andreas Ljungbergandreaslljungberg@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

Mohammad Shirviehpourshirvieh@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

Michael Odälv
Michael Odälvmichael@odalv.com
Gick med 2026-03-04
Konto-/kreditkort

Mehdi Shirviehpour79j55s2fhh@privaterelay.appleid.com
Gick med 2026-03-04
Konto-/kreditkort

Amir Omraniomraniforprez@gmail.com
Gick med 2026-03-04
Konto-/kreditkort

Stig Kjörstad
Stig Kjörstadstigak@hotmail.com
Gick med 2026-03-04
Konto-/kreditkort

Wilma Svenssonwilsve08@gmail.com
Gick med 2026-03-03
Konto-/kreditkort

Leo Englundleolehto2@icloud.com
Gick med 2026-03-03
Konto-/kreditkort

Gustav Knapegustav.knape@gmail.com
Gick med 2026-03-03
Klippkort

Peter Dahlkvist
Peter Dahlkvistpeter@skaplig.se
Gick med 2026-03-03
Klippkort

Lian Bengtssonlian.bengtsson@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

Fabio Pezzotti
Fabio Pezzottifabio.pezzotti.r@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

Lars Hjertonsson
Lars Hjertonssonlars.hjertonsson@volvo.com
Gick med 2026-03-02
Klippkort

Mikael Mattsson
Mikael Mattssonmikael@toyoretail.se
Gick med 2026-03-02
Klippkort

Eric Sandgren
Eric Sandgreneric_sandgren@hotmail.com
Gick med 2026-03-02
Konto-/kreditkort

Liwei Zhang
Liwei ZHANG NYBORGtanming7@163.com
Gick med 2026-03-02
Klippkort

Jenna Pakkajenna.pakka@hotmail.com
Gick med 2026-03-02
Konto-/kreditkort

Maria Forsling
Maria Forslingmariaveronica.forsling@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

Magnus Kjerrman
Magnus Kjerrmanmagnus.kjerrman@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

Karin Stagekarin.stage@educ.goteborg.se
Gick med 2026-03-01
Klippkort

Ola Bäckman
Ola Bäckmanbackman.ola@gmail.com
Gick med 2026-03-01
Konto-/kreditkort

Malou Hultberg
Malou Hultbergmaloukarlsson@hotmail.se
Gick med 2026-03-01
Konto-/kreditkort`

    const expected: Array<{ name: string; email: string }> = [
      { name: "Karim Chawqui", email: "karimski@hotmail.com" },
      { name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" },
      { name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" },
      { name: "Mohammad Shirvieh", email: "pourshirvieh@gmail.com" },
      { name: "Michael Odälv", email: "michael@odalv.com" },
      { name: "Mehdi Shirviehpour", email: "79j55s2fhh@privaterelay.appleid.com" },
      { name: "Amir Omrani", email: "omraniforprez@gmail.com" },
      { name: "Stig Kjörstad", email: "stigak@hotmail.com" },
      { name: "Wilma Svensson", email: "wilsve08@gmail.com" },
      { name: "Leo Englund", email: "leolehto2@icloud.com" },
      { name: "Gustav Knape", email: "gustav.knape@gmail.com" },
      { name: "Peter Dahlkvist", email: "peter@skaplig.se" },
      { name: "Lian Bengtsson", email: "lian.bengtsson@gmail.com" },
      { name: "Fabio Pezzotti", email: "fabio.pezzotti.r@gmail.com" },
      { name: "Lars Hjertonsson", email: "lars.hjertonsson@volvo.com" },
      { name: "Mikael Mattsson", email: "mikael@toyoretail.se" },
      { name: "Eric Sandgren", email: "eric_sandgren@hotmail.com" },
      { name: "Liwei Zhang", email: "tanming7@163.com" },
      { name: "Jenna Pakka", email: "jenna.pakka@hotmail.com" },
      { name: "Maria Forsling", email: "mariaveronica.forsling@gmail.com" },
      { name: "Magnus Kjerrman", email: "magnus.kjerrman@gmail.com" },
      { name: "Karin Stage", email: "karin.stage@educ.goteborg.se" },
      { name: "Ola Bäckman", email: "backman.ola@gmail.com" },
      { name: "Malou Hultberg", email: "maloukarlsson@hotmail.se" },
    ]

    const result = parseBookingText(input)
    expect(result).toHaveLength(24)
    result.forEach((participant, i) => {
      expect(participant.name).toBe(expected[i].name)
      expect(participant.email).toBe(expected[i].email)
    })
  })

  it("correctly handles names with repeated last-word pattern (repetition heuristic)", () => {
    // Repetition: "Shirvieh" appears at start and again in email local
    const input = "Mohammad Shirviehpourshirvieh@gmail.com\n"
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Mohammad Shirvieh")
    expect(result[0].email).toBe("pourshirvieh@gmail.com")
  })

  it("correctly handles names with Swedish non-ASCII characters (ö, ä, å)", () => {
    const input = [
      "Stig Kjörstad",
      "Stig Kjörstadstigak@hotmail.com",
      "",
      "Michael Odälv",
      "Michael Odälvmichael@odalv.com",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Stig Kjörstad", email: "stigak@hotmail.com" })
    expect(result[1]).toEqual({ name: "Michael Odälv", email: "michael@odalv.com" })
  })

  it("correctly handles digit-containing email locals (wilsve08, leolehto2)", () => {
    // These use the name-word boundary after digit heuristic fails
    const input = [
      "Wilma Svenssonwilsve08@gmail.com",
      "",
      "Leo Englundleolehto2@icloud.com",
      "",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Wilma Svensson", email: "wilsve08@gmail.com" })
    expect(result[1]).toEqual({ name: "Leo Englund", email: "leolehto2@icloud.com" })
  })

  it("correctly handles ALL-CAPS name suffix jammed against email (Liwei ZHANG NYBORG)", () => {
    // The prevLine is "Liwei Zhang", the jammed line starts case-insensitively with it
    // then has " ZHANG NYBORGtanming7@163.com"
    const input = [
      "Liwei Zhang",
      "Liwei ZHANG NYBORGtanming7@163.com",
      "Gick med 2026-03-02",
      "Klippkort",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Liwei Zhang")
    expect(result[0].email).toBe("tanming7@163.com")
  })

  it("correctly handles non-ASCII + name-word fallback (Ola Bäckman)", () => {
    const input = [
      "Ola Bäckman",
      "Ola Bäckmanbackman.ola@gmail.com",
      "Gick med 2026-03-01",
      "Konto-/kreditkort",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Ola Bäckman")
    expect(result[0].email).toBe("backman.ola@gmail.com")
  })

  it("correctly handles all-ASCII name-word boundary without any other hint (Malou Hultberg)", () => {
    const input = [
      "Malou Hultberg",
      "Malou Hultbergmaloukarlsson@hotmail.se",
      "Gick med 2026-03-01",
      "Konto-/kreditkort",
    ].join("\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Malou Hultberg")
    expect(result[0].email).toBe("maloukarlsson@hotmail.se")
  })

  it("returns empty array for empty input", () => {
    expect(parseBookingText("")).toEqual([])
    expect(parseBookingText("   \n  \n ")).toEqual([])
  })

  it("handles all 24 participants from the exact real-world email paste (space-only separators)", () => {
    // This is the verbatim format copy-pasted from a Matchi booking confirmation
    // email. Participant blocks are separated by a blank line + a space-only line.
    // Single-line participants (no standalone name line) must also be found.
    const input = `Karim Chawqui
Karim Chawquikarimski@hotmail.com
Gick med 2026-03-05
Konto-/kreditkort

 
Staffan Hagström
Staffan Hagströmhagstrom.staffan@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

 
Andreas Ljungberg
Andreas Ljungbergandreaslljungberg@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

 

Mohammad Shirviehpourshirvieh@gmail.com
Gick med 2026-03-05
Konto-/kreditkort

 
Michael Odälv
Michael Odälvmichael@odalv.com
Gick med 2026-03-04
Konto-/kreditkort

 

Mehdi Shirviehpour79j55s2fhh@privaterelay.appleid.com
Gick med 2026-03-04
Konto-/kreditkort

 

Amir Omraniomraniforprez@gmail.com
Gick med 2026-03-04
Konto-/kreditkort

 
Stig Kjörstad
Stig Kjörstadstigak@hotmail.com
Gick med 2026-03-04
Konto-/kreditkort

 

Wilma Svenssonwilsve08@gmail.com
Gick med 2026-03-03
Konto-/kreditkort

 

Leo Englundleolehto2@icloud.com
Gick med 2026-03-03
Konto-/kreditkort

 

Gustav Knapegustav.knape@gmail.com
Gick med 2026-03-03
Klippkort

 
Peter Dahlkvist
Peter Dahlkvistpeter@skaplig.se
Gick med 2026-03-03
Klippkort

 

Lian Bengtssonlian.bengtsson@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

 
Fabio Pezzotti
Fabio Pezzottifabio.pezzotti.r@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

 
Lars Hjertonsson
Lars Hjertonssonlars.hjertonsson@volvo.com
Gick med 2026-03-02
Klippkort

 
Mikael Mattsson
Mikael Mattssonmikael@toyoretail.se
Gick med 2026-03-02
Klippkort

 
Eric Sandgren
Eric Sandgreneric_sandgren@hotmail.com
Gick med 2026-03-02
Konto-/kreditkort

 
Liwei Zhang
Liwei ZHANG NYBORGtanming7@163.com
Gick med 2026-03-02
Klippkort

 

Jenna Pakkajenna.pakka@hotmail.com
Gick med 2026-03-02
Konto-/kreditkort

 
Maria Forsling
Maria Forslingmariaveronica.forsling@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

 
Magnus Kjerrman
Magnus Kjerrmanmagnus.kjerrman@gmail.com
Gick med 2026-03-02
Konto-/kreditkort

 

Karin Stagekarin.stage@educ.goteborg.se
Gick med 2026-03-01
Klippkort

 

Ola Bäckmanbackman.ola@gmail.com
Gick med 2026-03-01
Konto-/kreditkort

 

Malou Hultbergmaloukarlsson@hotmail.se
Gick med 2026-02-28`

    const result = parseBookingText(input)
    expect(result).toHaveLength(24)

    const expected: Array<{ name: string; email: string }> = [
      { name: "Karim Chawqui",    email: "karimski@hotmail.com" },
      { name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" },
      { name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" },
      { name: "Mohammad Shirvieh", email: "pourshirvieh@gmail.com" },
      { name: "Michael Odälv",    email: "michael@odalv.com" },
      { name: "Mehdi Shirviehpour", email: "79j55s2fhh@privaterelay.appleid.com" },
      { name: "Amir Omrani",      email: "omraniforprez@gmail.com" },
      { name: "Stig Kjörstad",    email: "stigak@hotmail.com" },
      { name: "Wilma Svensson",   email: "wilsve08@gmail.com" },
      { name: "Leo Englund",      email: "leolehto2@icloud.com" },
      { name: "Gustav Knape",     email: "gustav.knape@gmail.com" },
      { name: "Peter Dahlkvist",  email: "peter@skaplig.se" },
      { name: "Lian Bengtsson",   email: "lian.bengtsson@gmail.com" },
      { name: "Fabio Pezzotti",   email: "fabio.pezzotti.r@gmail.com" },
      { name: "Lars Hjertonsson", email: "lars.hjertonsson@volvo.com" },
      { name: "Mikael Mattsson",  email: "mikael@toyoretail.se" },
      { name: "Eric Sandgren",    email: "eric_sandgren@hotmail.com" },
      { name: "Liwei Zhang",      email: "tanming7@163.com" },
      { name: "Jenna Pakka",      email: "jenna.pakka@hotmail.com" },
      { name: "Maria Forsling",   email: "mariaveronica.forsling@gmail.com" },
      { name: "Magnus Kjerrman",  email: "magnus.kjerrman@gmail.com" },
      { name: "Karin Stage",      email: "karin.stage@educ.goteborg.se" },
      { name: "Ola Bäckman",      email: "backman.ola@gmail.com" },
      { name: "Malou Hultberg",   email: "maloukarlsson@hotmail.se" },
    ]

    result.forEach((p, i) => {
      expect(p.name, `participant ${i} name`).toBe(expected[i].name)
      expect(p.email, `participant ${i} email`).toBe(expected[i].email)
    })
  })

  // ---------------------------------------------------------------------------
  // Tab-separated (Excel plain-text) parser tests
  // ---------------------------------------------------------------------------

  it("parses a simple tab-separated row with name and email", () => {
    const input = "Karim Chawqui\tkarimski@hotmail.com\r\n"
    const result = parseBookingText(input)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
  })

  it("parses multiple tab-separated rows", () => {
    const input = [
      "Karim Chawqui\tkarimski@hotmail.com\tGick med 2026-03-05\tKonto-/kreditkort",
      "Staffan Hagström\thagstrom.staffan@gmail.com\tGick med 2026-03-05\tKonto-/kreditkort",
      "Andreas Ljungberg\tandreaslljungberg@gmail.com\tGick med 2026-03-05\tKonto-/kreditkort",
    ].join("\r\n")
    const result = parseBookingText(input)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
    expect(result[1]).toEqual({ name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" })
    expect(result[2]).toEqual({ name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" })
  })

  it("skips tab-separated rows without an email column", () => {
    const input = [
      "Name\tEmail\tDate",
      "Karim Chawqui\tkarimski@hotmail.com\t2026-03-05",
      "No email row\t\t2026-03-05",
      "Peter Dahlkvist\tpeter@skaplig.se\t2026-03-03",
    ].join("\n")
    const result = parseBookingText(input)
    // Header row has no @ and is skipped; "No email row" has empty email and is skipped
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
    expect(result[1]).toEqual({ name: "Peter Dahlkvist", email: "peter@skaplig.se" })
  })

  it("deduplicates tab-separated rows by email", () => {
    const input = [
      "Alice Smith\talice@example.com",
      "Alice Smith\talice@example.com",
    ].join("\n")
    expect(parseBookingText(input)).toHaveLength(1)
  })

  it("handles all 24 participants from a real-world Excel tab-separated export", () => {
    const participants = [
      ["Karim Chawqui", "karimski@hotmail.com"],
      ["Staffan Hagström", "hagstrom.staffan@gmail.com"],
      ["Andreas Ljungberg", "andreaslljungberg@gmail.com"],
      ["Mohammad Shirvieh", "pourshirvieh@gmail.com"],
      ["Michael Odälv", "michael@odalv.com"],
      ["Mehdi Shirviehpour", "79j55s2fhh@privaterelay.appleid.com"],
      ["Amir Omrani", "omraniforprez@gmail.com"],
      ["Stig Kjörstad", "stigak@hotmail.com"],
      ["Wilma Svensson", "wilsve08@gmail.com"],
      ["Leo Englund", "leolehto2@icloud.com"],
      ["Gustav Knape", "gustav.knape@gmail.com"],
      ["Peter Dahlkvist", "peter@skaplig.se"],
      ["Lian Bengtsson", "lian.bengtsson@gmail.com"],
      ["Fabio Pezzotti", "fabio.pezzotti.r@gmail.com"],
      ["Lars Hjertonsson", "lars.hjertonsson@volvo.com"],
      ["Mikael Mattsson", "mikael@toyoretail.se"],
      ["Eric Sandgren", "eric_sandgren@hotmail.com"],
      ["Liwei Zhang", "tanming7@163.com"],
      ["Jenna Pakka", "jenna.pakka@hotmail.com"],
      ["Maria Forsling", "mariaveronica.forsling@gmail.com"],
      ["Magnus Kjerrman", "magnus.kjerrman@gmail.com"],
      ["Karin Stage", "karin.stage@educ.goteborg.se"],
      ["Ola Bäckman", "backman.ola@gmail.com"],
      ["Malou Hultberg", "maloukarlsson@hotmail.se"],
    ]
    const input = participants
      .map(([name, email]) => `${name}\t${email}\tGick med 2026-03-01\tKonto-/kreditkort`)
      .join("\r\n")

    const result = parseBookingText(input)
    expect(result).toHaveLength(24)
    participants.forEach(([name, email], i) => {
      expect(result[i].name).toBe(name)
      expect(result[i].email).toBe(email)
    })
  })
})

// ---------------------------------------------------------------------------
// HTML parser tests
// ---------------------------------------------------------------------------

describe("parseBookingHtml", () => {
  it("extracts name from bold tag and email from adjacent text", () => {
    const html = `<p><b>Karim Chawqui</b>karimski@hotmail.com</p>`
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Karim Chawqui")
    expect(result[0].email).toBe("karimski@hotmail.com")
  })

  it("extracts name from strong tag", () => {
    const html = `<p><strong>Alice Smith</strong>alice@example.com</p>`
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Alice Smith")
    expect(result[0].email).toBe("alice@example.com")
  })

  it("handles multiple participants in HTML", () => {
    const html = `
      <div><b>Staffan Hagström</b>hagstrom.staffan@gmail.com<br>Gick med 2026-03-05</div>
      <div><b>Andreas Ljungberg</b>andreaslljungberg@gmail.com<br>Gick med 2026-03-05</div>
    `
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" })
    expect(result[1]).toEqual({ name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" })
  })

  it("deduplicates by email in HTML input", () => {
    const html = `
      <p><b>Alice</b>alice@example.com</p>
      <p><b>Alice</b>alice@example.com</p>
    `
    expect(parseBookingHtml(html)).toHaveLength(1)
  })

  it("returns empty array when no bold elements found", () => {
    const html = `<p>No bold text here. Just plain paragraphs.</p>`
    expect(parseBookingHtml(html)).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // Excel table HTML tests
  // ---------------------------------------------------------------------------

  it("parses a simple Excel table with Name and Email columns", () => {
    const html = `
      <table>
        <tr><td>Karim Chawqui</td><td>karimski@hotmail.com</td></tr>
        <tr><td>Staffan Hagström</td><td>hagstrom.staffan@gmail.com</td></tr>
      </table>
    `
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
    expect(result[1]).toEqual({ name: "Staffan Hagström", email: "hagstrom.staffan@gmail.com" })
  })

  it("handles Excel table with extra columns (date, payment method)", () => {
    const html = `
      <table>
        <tr>
          <td>Karim Chawqui</td>
          <td>karimski@hotmail.com</td>
          <td>Gick med 2026-03-05</td>
          <td>Konto-/kreditkort</td>
        </tr>
        <tr>
          <td>Andreas Ljungberg</td>
          <td>andreaslljungberg@gmail.com</td>
          <td>Gick med 2026-03-05</td>
          <td>Konto-/kreditkort</td>
        </tr>
      </table>
    `
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
    expect(result[1]).toEqual({ name: "Andreas Ljungberg", email: "andreaslljungberg@gmail.com" })
  })

  it("skips header rows in Excel table (rows with no @ cell)", () => {
    const html = `
      <table>
        <tr><td>Name</td><td>Email</td><td>Date</td></tr>
        <tr><td>Karim Chawqui</td><td>karimski@hotmail.com</td><td>2026-03-05</td></tr>
        <tr><td>Peter Dahlkvist</td><td>peter@skaplig.se</td><td>2026-03-03</td></tr>
      </table>
    `
    const result = parseBookingHtml(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ name: "Karim Chawqui", email: "karimski@hotmail.com" })
    expect(result[1]).toEqual({ name: "Peter Dahlkvist", email: "peter@skaplig.se" })
  })

  it("deduplicates by email in Excel table", () => {
    const html = `
      <table>
        <tr><td>Alice Smith</td><td>alice@example.com</td></tr>
        <tr><td>Alice Smith</td><td>alice@example.com</td></tr>
      </table>
    `
    expect(parseBookingHtml(html)).toHaveLength(1)
  })

  it("handles all 24 participants from a real-world Excel/Matchi table export", () => {
    const rows = [
      ["Karim Chawqui", "karimski@hotmail.com"],
      ["Staffan Hagström", "hagstrom.staffan@gmail.com"],
      ["Andreas Ljungberg", "andreaslljungberg@gmail.com"],
      ["Mohammad Shirvieh", "pourshirvieh@gmail.com"],
      ["Michael Odälv", "michael@odalv.com"],
      ["Mehdi Shirviehpour", "79j55s2fhh@privaterelay.appleid.com"],
      ["Amir Omrani", "omraniforprez@gmail.com"],
      ["Stig Kjörstad", "stigak@hotmail.com"],
      ["Wilma Svensson", "wilsve08@gmail.com"],
      ["Leo Englund", "leolehto2@icloud.com"],
      ["Gustav Knape", "gustav.knape@gmail.com"],
      ["Peter Dahlkvist", "peter@skaplig.se"],
      ["Lian Bengtsson", "lian.bengtsson@gmail.com"],
      ["Fabio Pezzotti", "fabio.pezzotti.r@gmail.com"],
      ["Lars Hjertonsson", "lars.hjertonsson@volvo.com"],
      ["Mikael Mattsson", "mikael@toyoretail.se"],
      ["Eric Sandgren", "eric_sandgren@hotmail.com"],
      ["Liwei Zhang", "tanming7@163.com"],
      ["Jenna Pakka", "jenna.pakka@hotmail.com"],
      ["Maria Forsling", "mariaveronica.forsling@gmail.com"],
      ["Magnus Kjerrman", "magnus.kjerrman@gmail.com"],
      ["Karin Stage", "karin.stage@educ.goteborg.se"],
      ["Ola Bäckman", "backman.ola@gmail.com"],
      ["Malou Hultberg", "maloukarlsson@hotmail.se"],
    ]
    const tableRows = rows
      .map(([name, email]) => `<tr><td>${name}</td><td>${email}</td></tr>`)
      .join("\n")
    const html = `<table>${tableRows}</table>`

    const result = parseBookingHtml(html)
    expect(result).toHaveLength(24)
    rows.forEach(([name, email], i) => {
      expect(result[i].name).toBe(name)
      expect(result[i].email).toBe(email)
    })
  })
})
