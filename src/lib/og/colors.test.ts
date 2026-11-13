import { describe, expect, test } from "bun:test"
import { readTokensCss, themeTokens } from "../tokens"
import { cardColors } from "./colors"

describe("cardColors", () => {
  test("maps the light theme tokens", () => {
    const colors = cardColors(themeTokens(readTokensCss(), "light"))
    expect(colors.bg).toBe("#ffffff")
    expect(colors.canvas).toBe("#fafafb")
    expect(colors.brand).toBe("#097d84")
    expect(Object.keys(colors).sort()).toEqual(["bg", "border", "brand", "canvas", "fg", "mfg"])
  })

  test("names the missing token", () => {
    expect(() => cardColors({})).toThrow("tokens.css: --bg missing for the social card")
  })

  test("throws when only one token is absent", () => {
    const light = themeTokens(readTokensCss(), "light")
    delete light["--brand"]
    expect(() => cardColors(light)).toThrow("tokens.css: --brand missing for the social card")
  })
})
