import { describe, expect, test } from "bun:test"
import { startsHidden } from "./reveal"

describe("startsHidden", () => {
  test.each([
    [0, 800, false],
    [799, 800, false],
    [800, 800, true],
    [2400, 800, true],
    [-300, 800, false],
  ])("top %d in a %d tall viewport starts hidden: %p", (top, viewportHeight, expected) => {
    expect(startsHidden(top, viewportHeight)).toBe(expected)
  })
})
