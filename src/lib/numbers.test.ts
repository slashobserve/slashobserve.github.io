import { describe, expect, test } from "bun:test"
import { percentDown } from "./numbers"

describe("percentDown", () => {
  test.each([
    [1, 3, 33],
    [2, 3, 66],
    [1696, 2814, 60],
    [99, 100, 99],
    [999, 1000, 99],
    [1, 1000, 0],
    [0, 5, 0],
    [5, 5, 100],
  ])("rounds %i of %i down to %i percent", (part, whole, expected) => {
    expect(percentDown(part, whole)).toBe(expected)
  })

  test("is 0 when the whole is 0", () => {
    expect(percentDown(0, 0)).toBe(0)
    expect(percentDown(3, 0)).toBe(0)
  })
})
