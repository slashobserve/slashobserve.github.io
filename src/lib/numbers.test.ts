import { describe, expect, test } from "bun:test"
import { formatCount, percentDown } from "./numbers"

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

describe("formatCount", () => {
  test("groups thousands with commas", () => {
    expect(formatCount(7)).toBe("7")
    expect(formatCount(1696)).toBe("1,696")
    expect(formatCount(1234567)).toBe("1,234,567")
  })
})
