import { describe, expect, test } from "bun:test"
import { readTokensCss, themeTokens } from "../tokens"
import { cardColors } from "./colors"

describe("cardColors", () => {
  test("maps the light theme tokens", () => {
    const colors = cardColors(themeTokens(readTokensCss(), "light"))
    expect(colors.bg).toBe("#ffffff")
    expect(colors.brand).toBe("#2a78d6")
    expect(colors.halo).toBe("rgba(42,120,214,0.20)")
  })

  test("names the missing token", () => {
    expect(() => cardColors({})).toThrow("tokens.css: --bg missing for the social card")
  })

  test("throws when only one token is absent", () => {
    const light = themeTokens(readTokensCss(), "light")
    delete light["--halo"]
    expect(() => cardColors(light)).toThrow("tokens.css: --halo missing for the social card")
  })
})
