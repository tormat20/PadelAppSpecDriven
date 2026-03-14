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

  it("handles the full sample input", () => {
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

Peter Dahlkvist
Peter Dahlkvistpeter@skaplig.se
Gick med 2026-03-03
Klippkort`

    const result = parseBookingText(input)
    expect(result.length).toBeGreaterThanOrEqual(9)
    const emails = result.map((r) => r.email)
    expect(emails).toContain("karimski@hotmail.com")
    expect(emails).toContain("hagstrom.staffan@gmail.com")
    expect(emails).toContain("andreaslljungberg@gmail.com")
    expect(emails).toContain("pourshirvieh@gmail.com")
    expect(emails).toContain("michael@odalv.com")
    expect(emails).toContain("79j55s2fhh@privaterelay.appleid.com")
    expect(emails).toContain("omraniforprez@gmail.com")
    expect(emails).toContain("stigak@hotmail.com")
    expect(emails).toContain("peter@skaplig.se")
  })

  it("returns empty array for empty input", () => {
    expect(parseBookingText("")).toEqual([])
    expect(parseBookingText("   \n  \n ")).toEqual([])
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
})
