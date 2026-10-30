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

describe("eyebrow colours", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`eyebrow text passes AA over the halo in ${theme}`, () => {
      const t = themeTokens(readTokensCss(), theme)
      const halo = over(parseColor(t["--gridline"]), over(parseColor(t["--halo"]), parseColor(t["--bg"])))
      const text = parseColor(t["--brand-text"])
      expect(contrastRatio(text, halo)).toBeGreaterThanOrEqual(4.5)
      for (const surface of ["--bg", "--muted-bg", "--surface"]) {
        expect(contrastRatio(text, parseColor(t[surface]))).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

describe("monochrome palette", () => {
  for (const theme of ["light", "dark"] as const) {
    const t = themeTokens(readTokensCss(), theme)
    const colour = (name: string) => parseColor(t[name])

    test(`focus ring has 3:1 against the page surfaces in ${theme}`, () => {
      for (const surface of ["--bg", "--surface", "--muted-bg"]) {
        expect(contrastRatio(colour("--brand"), colour(surface))).toBeGreaterThanOrEqual(3)
      }
    })

    test(`band text passes AA on the band surfaces in ${theme}`, () => {
      for (const text of ["--ink-fg", "--ink-mfg"]) {
        for (const surface of ["--band-bg", "--band-code"]) {
          expect(contrastRatio(colour(text), colour(surface))).toBeGreaterThanOrEqual(4.5)
        }
      }
      expect(contrastRatio(colour("--ink-code"), colour("--band-code"))).toBeGreaterThanOrEqual(4.5)
    })

    test(`band stands out from the page in ${theme}`, () => {
      expect(contrastRatio(colour("--band-bg"), colour("--bg"))).toBeGreaterThanOrEqual(1.1)
    })

    test(`accent tokens are neutral grey in ${theme}`, () => {
      for (const name of ["--brand", "--brand-text", "--brand-muted", "--sel"]) {
        const { r, g, b } = colour(name)
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(12)
      }
    })
  }
})
