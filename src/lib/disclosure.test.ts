import { describe, expect, test } from "bun:test"
import { isExpandable } from "./disclosure"

describe("isExpandable", () => {
  test.each([
    [0, false],
    [1, false],
    [2, true],
    [24, true],
  ])("a group with %i children expandable is %p", (count, expected) => {
    expect(isExpandable(count)).toBe(expected)
  })
})
