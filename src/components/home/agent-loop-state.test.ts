import { describe, expect, test } from "bun:test"
import { LAST_STEP, nextStep, sceneAt, type Step } from "./agent-loop-state"

describe("nextStep", () => {
  test.each<[Step, Step]>([
    [0, 1],
    [1, 2],
    [2, 0],
  ])("step %i is followed by step %i", (from, to) => {
    expect(nextStep(from)).toBe(to)
  })
})

describe("sceneAt", () => {
  test("step 0 shows the draft with placeholders only", () => {
    expect(sceneAt(0)).toEqual({
      placeholders: true,
      firstRun: false,
      followUp: false,
      showLogsPanel: false,
      versionLabel: "draft",
    })
  })

  test("step 1 shows the first run with the error logs panel", () => {
    expect(sceneAt(1)).toEqual({
      placeholders: false,
      firstRun: true,
      followUp: false,
      showLogsPanel: true,
      versionLabel: "v1",
    })
  })

  test("step 2 shows the follow-up change and drops the error logs panel", () => {
    expect(sceneAt(2)).toEqual({
      placeholders: false,
      firstRun: true,
      followUp: true,
      showLogsPanel: false,
      versionLabel: "v2",
    })
  })

  test("the island starts on the fully played scene", () => {
    expect(LAST_STEP).toBe(2)
  })
})
