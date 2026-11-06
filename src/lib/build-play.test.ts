import { describe, expect, test } from "bun:test"
import { nextStep, panelShown, playLabel, railLines, windowStatus } from "./build-play"

describe("railLines", () => {
  test("step 0 shows the inventory line alone, active", () => {
    expect(railLines(0)).toEqual([
      { text: 'Listed 12 metric families in {job="checkout"} on prom-prod', tone: "active" },
    ])
  })

  test("step 1 shows four lines ending on the first save, active", () => {
    const lines = railLines(1)
    expect(lines.map((line) => line.text)).toEqual([
      'Listed 12 metric families in {job="checkout"} on prom-prod',
      "Listed 3 label values on prom-prod",
      "Ran a query on prom-prod: 3 series",
      "Saved panel 1 of 12: Requests/s (row Overview)",
    ])
    expect(lines.map((line) => line.tone)).toEqual(["done", "done", "done", "active"])
  })

  test("step 5 keeps the last six lines", () => {
    expect(railLines(5).map((line) => line.text)).toEqual([
      "Ran a query on prom-prod: 3 series",
      "Saved panel 1 of 12: Requests/s (row Overview)",
      "Saved panel 2 of 12: Error ratio (row Overview)",
      "Saved panel 3 of 12: p95 latency (row Overview)",
      "Saved panel 4 of 12: Pods ready (row Overview)",
      "Saved panel 5 of 12: Requests by pod (row Traffic)",
    ])
  })

  test("step 12 ends on the saved version with every line done", () => {
    const lines = railLines(12)
    expect(lines.map((line) => line.text)).toEqual([
      "Saved panel 8 of 12: DB pool in use (row Internals)",
      "Saved panel 9 of 12: Queue depth (row Internals)",
      "Saved panel 10 of 12: Payment success (row Internals)",
      "Saved panel 11 of 12: Reservations/s (row Internals)",
      "Saved panel 12 of 12: GC pause p99 (row Internals)",
      "Saved version 1 (3 rows, 12 panels)",
    ])
    expect(lines.every((line) => line.tone === "done")).toBe(true)
  })

  test("steps outside the script clamp to its ends", () => {
    expect(railLines(-3)).toEqual(railLines(0))
    expect(railLines(40)).toEqual(railLines(12))
  })
})

describe("panelShown", () => {
  test("a panel shows once its save has happened", () => {
    expect(panelShown(3, 3)).toBe(true)
    expect(panelShown(3, 4)).toBe(false)
  })
})

describe("windowStatus", () => {
  test("counts saves until the build finishes", () => {
    expect(windowStatus(4)).toBe("saved 4 of 12")
    expect(windowStatus(12)).toBe("version 1 · 12 panels")
  })
})

describe("playLabel", () => {
  test.each([
    ["ready", "Play the build"],
    ["playing", "Building…"],
    ["done", "Play again"],
  ] as const)("%s reads %s", (phase, label) => {
    expect(playLabel(phase)).toBe(label)
  })
})

describe("nextStep", () => {
  test("advances one save and stops at the last panel", () => {
    expect(nextStep(0)).toBe(1)
    expect(nextStep(11)).toBe(12)
    expect(nextStep(12)).toBe(12)
  })
})
