export const PANEL_COUNT = 12
export const SAVE_MS = 420
export const RAIL_ROWS = 6

export type PlayPhase = "ready" | "playing" | "done"
export type RailLine = { text: string; tone: "active" | "done" }

const SCRIPT: readonly string[] = [
  'Scoped job="checkout" · 12 metric families',
  `Planned ${PANEL_COUNT} panels in 3 rows`,
  "Running queries, one panel per save",
  ...Array.from({ length: PANEL_COUNT }, (_, i) => `Saved panel ${i + 1} of ${PANEL_COUNT}`),
  "Saved version 1 · /d/4f1c/checkout-health · 0 uncovered",
]

const LINES_BEFORE_SAVES = 3

function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), PANEL_COUNT)
}

export function railLines(step: number): RailLine[] {
  const at = clampStep(step)
  const shownCount = at === 0 ? 1 : LINES_BEFORE_SAVES + at + (at === PANEL_COUNT ? 1 : 0)
  const shown = SCRIPT.slice(0, shownCount).slice(-RAIL_ROWS)
  const activeLast = at < PANEL_COUNT
  return shown.map((text, i) => ({
    text,
    tone: activeLast && i === shown.length - 1 ? "active" : "done",
  }))
}

export function panelShown(step: number, panel: number): boolean {
  return step >= panel
}

export function windowStatus(step: number): string {
  return step >= PANEL_COUNT ? `version 1 · ${PANEL_COUNT} panels` : `saved ${step} of ${PANEL_COUNT}`
}

const PLAY_LABELS: Record<PlayPhase, string> = {
  ready: "Play the build",
  playing: "Building…",
  done: "Play again",
}

export function playLabel(phase: PlayPhase): string {
  return PLAY_LABELS[phase]
}

export function nextStep(step: number): number {
  return Math.min(step + 1, PANEL_COUNT)
}
