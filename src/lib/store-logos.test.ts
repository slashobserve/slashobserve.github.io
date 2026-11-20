import { describe, expect, test } from "bun:test"
import { logoAspect, STORE_LOGOS } from "./store-logos"

describe("logoAspect", () => {
  test("is one for a square logo", () => {
    expect(logoAspect(STORE_LOGOS.prometheus)).toBe(1)
  })

  test("is the width over the height for a logo that is not square", () => {
    expect(logoAspect({ viewBox: "-10 5 30 60", paths: [] })).toBe(0.5)
  })
})
