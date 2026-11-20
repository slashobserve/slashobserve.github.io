import { describe, expect, test } from "bun:test"
import { stopForHash, tabForKey, tabId, tourTitle } from "./tour"

describe("tourTitle", () => {
  test.each([
    [1, "One workspace, one place to stand."],
    [4, "One workspace, four places to stand."],
    [5, "One workspace, five places to stand."],
    [10, "One workspace, ten places to stand."],
    [11, "One workspace, 11 places to stand."],
  ])("counts %p stops as %p", (count, title) => {
    expect(tourTitle(count)).toBe(title)
  })
})

describe("tabId", () => {
  test("differs from the id of the stop it opens", () => {
    expect(tabId("inbox")).toBe("inbox-tab")
  })
})

describe("tabForKey", () => {
  test.each([
    ["ArrowRight", 0, 1],
    ["ArrowRight", 4, 0],
    ["ArrowLeft", 2, 1],
    ["ArrowLeft", 0, 4],
    ["Home", 3, 0],
    ["End", 1, 4],
  ])("%p from tab %p of five moves to tab %p", (key, current, next) => {
    expect(tabForKey(key, current, 5)).toBe(next)
  })

  test("leaves every other key to the browser", () => {
    expect(tabForKey("Enter", 2, 5)).toBeNull()
    expect(tabForKey("ArrowDown", 2, 5)).toBeNull()
  })

  test("moves nowhere when there are no tabs", () => {
    expect(tabForKey("ArrowRight", 0, 0)).toBeNull()
  })
})

describe("stopForHash", () => {
  const ids = ["inbox", "observations", "logs-and-traces"]

  test("finds the stop a hash names", () => {
    expect(stopForHash("#logs-and-traces", ids)).toBe(2)
    expect(stopForHash("inbox", ids)).toBe(0)
  })

  test("finds nothing for an empty hash or a hash of another section", () => {
    expect(stopForHash("", ids)).toBeNull()
    expect(stopForHash("#pricing", ids)).toBeNull()
  })
})
