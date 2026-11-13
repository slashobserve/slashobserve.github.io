import { describe, expect, test } from "bun:test"
import { contrastRatio, over, parseColor } from "./contrast"
import { readTokensCss, themeTokens } from "./tokens"

describe("contrastRatio", () => {
  test("matches the known WCAG ratios", () => {
    expect(contrastRatio(parseColor("#000000"), parseColor("#ffffff"))).toBeCloseTo(21, 5)
    expect(contrastRatio(parseColor("#2a78d6"), parseColor("#ffffff"))).toBeCloseTo(4.42, 2)
  })

  test("is the same whichever colour is first", () => {
    const a = parseColor("#195aa8")
    const b = parseColor("#f7f8f9")
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a))
  })

  test("rejects translucent colours", () => {
    expect(() => contrastRatio(parseColor("rgba(0,0,0,0.5)"), parseColor("#ffffff"))).toThrow(
      "contrastRatio needs opaque colours",
    )
  })
})

describe("parseColor", () => {
  test("reads hex and rgba with spaces", () => {
    expect(parseColor("#2a78d6")).toEqual({ r: 42, g: 120, b: 214, a: 1 })
    expect(parseColor("rgba(42, 120, 214, 0.2)")).toEqual({ r: 42, g: 120, b: 214, a: 0.2 })
  })

  test("throws on other colour syntaxes", () => {
    expect(() => parseColor("hsl(0 0% 0%)")).toThrow("unsupported colour: hsl(0 0% 0%)")
  })
})

describe("over", () => {
  test("composites a translucent colour onto an opaque one", () => {
    const result = over(parseColor("rgba(42,120,214,0.2)"), parseColor("#ffffff"))
    expect(result.r).toBeCloseTo(212.4, 5)
    expect(result.a).toBe(1)
  })
})

describe("accent palette", () => {
  for (const theme of ["light", "dark"] as const) {
    const t = themeTokens(readTokensCss(), theme)
    const colour = (name: string) => parseColor(t[name])
    const ratio = (text: string, surface: string) => contrastRatio(colour(text), colour(surface))
    const surfaces = ["--bg", "--card", "--chrome", "--canvas", "--muted", "--surface", "--muted-bg"]

    test(`accent text passes AA on page, card and chrome in ${theme}`, () => {
      for (const text of ["--brand", "--brand-text"]) {
        for (const surface of ["--bg", "--card", "--chrome"]) {
          expect(ratio(text, surface)).toBeGreaterThanOrEqual(4.5)
        }
      }
    })

    test(`primary button text passes AA on primary in ${theme}`, () => {
      expect(ratio("--pfg", "--primary")).toBeGreaterThanOrEqual(4.5)
    })

    test(`accent container text passes AA in ${theme}`, () => {
      expect(ratio("--on-accent-container", "--accent-container")).toBeGreaterThanOrEqual(4.5)
    })

    test(`focus ring has 3:1 against the page surfaces in ${theme}`, () => {
      for (const surface of surfaces) {
        expect(ratio("--brand", surface)).toBeGreaterThanOrEqual(3)
      }
    })

    test(`small muted text passes AA on every surface in ${theme}`, () => {
      for (const surface of surfaces) {
        expect(ratio("--mfg", surface)).toBeGreaterThanOrEqual(4.5)
      }
    })

    test(`person tints pass AA for their text in ${theme}`, () => {
      for (const tint of ["--p1", "--p2", "--p3", "--p4"]) {
        expect(ratio(`${tint}-fg`, tint)).toBeGreaterThanOrEqual(4.5)
      }
    })

    test(`status text passes AA on page and its container in ${theme}`, () => {
      for (const status of ["ok", "warn", "crit"]) {
        expect(ratio(`--${status}`, "--bg")).toBeGreaterThanOrEqual(4.5)
        expect(ratio(`--${status}`, `--${status}-container`)).toBeGreaterThanOrEqual(4.5)
      }
    })

    test(`band text passes AA on the band surface in ${theme}`, () => {
      for (const text of ["--band-fg", "--band-mfg"]) {
        expect(ratio(text, "--band-bg")).toBeGreaterThanOrEqual(4.5)
      }
    })

    test(`band stands out from the page by fill or by its top edge in ${theme}`, () => {
      const standsOut = Math.max(ratio("--band-bg", "--bg"), ratio("--band-edge", "--bg"))
      expect(standsOut).toBeGreaterThanOrEqual(1.1)
    })

    test(`band stays dark in ${theme}`, () => {
      expect(colour("--band-bg").r).toBeLessThan(32)
    })
  }
})
