import { describe, expect, test } from "bun:test"
import { activeStop, railItems, tourTitle } from "./tour"

describe("railItems", () => {
  test("lists the built stops in order with a link to each", () => {
    expect(
      railItems([
        { id: "inbox", place: "Inbox" },
        { id: "logs-and-traces", place: "Logs and traces" },
      ]),
    ).toEqual([
      { id: "inbox", label: "Inbox", href: "#inbox" },
      { id: "logs-and-traces", label: "Logs and traces", href: "#logs-and-traces" },
    ])
  })

  test("gives no items when nothing is built", () => {
    expect(railItems([])).toEqual([])
  })
})

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

describe("activeStop", () => {
  const tops = [-900, -300, 250, 900, 1500]

  test.each([
    [0, 1],
    [250, 2],
    [249, 1],
    [1000, 3],
    [5000, 4],
  ])("with the reading line at %p the stop at index %p is active", (line, index) => {
    expect(activeStop(tops, line)).toBe(index)
  })

  test("keeps the first stop active while the section is still below the line", () => {
    expect(activeStop([400, 1000, 1600], 100)).toBe(0)
  })

  test("returns the first stop when there are no stops", () => {
    expect(activeStop([], 100)).toBe(0)
  })
})
