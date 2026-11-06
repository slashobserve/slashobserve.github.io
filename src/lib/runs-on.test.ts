import { describe, expect, test } from "bun:test"
import { placeAt, spinClass } from "./runs-on"

describe("placeAt", () => {
  test("walks the places and wraps", () => {
    expect(placeAt(0)).toBe("AWS")
    expect(placeAt(5)).toBe("Fly.io")
    expect(placeAt(9)).toBe("Scaleway")
    expect(placeAt(10)).toBe("AWS")
  })

  test("never indexes below the first place", () => {
    expect(placeAt(-1)).toBe("Scaleway")
  })
})

describe("spinClass", () => {
  test("alternates so the slide-in restarts on every tick", () => {
    expect([0, 1, 2, 3].map(spinClass)).toEqual(["spin-b", "spin-a", "spin-b", "spin-a"])
  })
})
