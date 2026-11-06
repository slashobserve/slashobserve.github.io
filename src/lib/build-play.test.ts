import { describe, expect, test } from "bun:test"
import {
  buildStatus,
  composerText,
  nextStep,
  panelShown,
  playLabel,
  runningFor,
  stepSummary,
  timeline,
  topRowTitle,
} from "./build-play"

describe("timeline", () => {
  test("step 0 groups discovery and the first query into phases", () => {
    expect(timeline(0)).toEqual([
      {
        label: "Discovering",
        tools: "list_metrics, list_label_values",
        messages: ['Listed 12 metric families in {job="checkout"} on prom', "Listed 3 label values on prom"],
      },
      { label: "Running queries", tools: "query_range", messages: ["Ran a query on prom: 3 series"] },
    ])
  })

  test("saves join one Saving phase that counts repeated tools", () => {
    const saving = timeline(3).at(-1)
    expect(saving).toEqual({
      label: "Saving",
      tools: "create_dashboard, update_panels 2",
      messages: [
        "Saved panel 1 of 12: Requests/s (row Overview)",
        "Saved panel 2 of 12: Error ratio (row Overview)",
        "Saved panel 3 of 12: p95 latency (row Overview)",
      ],
    })
  })

  test("the last save also saves version 1", () => {
    const saving = timeline(12).at(-1)
    expect(saving?.tools).toBe("create_dashboard, update_panels 11")
    expect(saving?.messages).toHaveLength(12)
    expect(saving?.messages.at(-1)).toBe(
      "Saved panel 12 of 12: Cache hit ratio (row Internals), then saved version 1 (3 rows, 12 panels)",
    )
  })

  test("steps outside the build clamp to its ends", () => {
    expect(timeline(-3)).toEqual(timeline(0))
    expect(timeline(40)).toEqual(timeline(12))
  })
})

describe("buildStatus", () => {
  test("reads as the agent working until a panel is saved, then counts panels", () => {
    expect(buildStatus(0)).toBe("Building the dashboard")
    expect(buildStatus(4)).toBe("Building, 4 of 12 panels")
    expect(buildStatus(12)).toBe("Building, 12 of 12 panels")
  })
})

describe("stepSummary", () => {
  test("counts every discovery, query and save step and the time the last save took", () => {
    expect(stepSummary()).toBe("Ran 15 steps in 38s")
  })
})

describe("runningFor", () => {
  test("grows with each save and ends where the summary does", () => {
    expect(runningFor(0)).toBe("Running for 2s")
    expect(runningFor(5)).toBe("Running for 17s")
    expect(runningFor(12)).toBe("Running for 38s")
  })
})

describe("topRowTitle", () => {
  test("names the dashboard once the first panel is saved", () => {
    expect(topRowTitle(0)).toBe("New dashboard")
    expect(topRowTitle(1)).toBe("Checkout health")
  })
})

describe("composerText", () => {
  test("asks for a dashboard while building and for a change once done", () => {
    expect(composerText(false)).toEqual({
      placeholder: "Describe a dashboard, like: checkout health by pod, last 6h",
      note: "Wait for the dashboard, then ask for changes.",
    })
    expect(composerText(true)).toEqual({
      placeholder: "Ask for another change to Checkout health",
      note: "Each change is saved as a new version of the dashboard.",
    })
  })
})

describe("panelShown", () => {
  test("a panel shows once its save has happened", () => {
    expect(panelShown(3, 3)).toBe(true)
    expect(panelShown(3, 4)).toBe(false)
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
