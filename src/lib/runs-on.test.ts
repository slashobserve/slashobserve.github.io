import { describe, expect, test } from "bun:test"
import { placeAt, spinClass } from "./runs-on"

describe("placeAt", () => {
  test("walks the places and wraps", () => {
    expect(placeAt(0)).toBe("your laptop")
    expect(placeAt(2)).toBe("a Raspberry Pi")
    expect(placeAt(8)).toBe("Fly.io")
    expect(placeAt(9)).toBe("your laptop")
  })

  test("never indexes below the first place", () => {
    expect(placeAt(-1)).toBe("Fly.io")
  })
})

describe("spinClass", () => {
  test("alternates so the slide-in restarts on every tick", () => {
    expect([0, 1, 2, 3].map(spinClass)).toEqual(["spin-b", "spin-a", "spin-b", "spin-a"])
  })
})
