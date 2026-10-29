export type Step = 0 | 1 | 2

export const STEPS: readonly { label: string }[] = [
  { label: "You ask" },
  { label: "The agent checks every query" },
  { label: "Your team asks for a change" },
]

export const STEP_MS = 3200

export const LAST_STEP: Step = 2

export function nextStep(step: Step): Step {
  return ((step + 1) % 3) as Step
}

export type Scene = {
  placeholders: boolean
  firstRun: boolean
  followUp: boolean
  showLogsPanel: boolean
  versionLabel: "draft" | "v1" | "v2"
}

const VERSION_LABELS = ["draft", "v1", "v2"] as const

export function sceneAt(step: Step): Scene {
  return {
    placeholders: step === 0,
    firstRun: step >= 1,
    followUp: step >= 2,
    showLogsPanel: step === 1,
    versionLabel: VERSION_LABELS[step],
  }
}
