const BUILT_PANELS = [
  { title: "Requests/s", row: "Overview" },
  { title: "Error ratio", row: "Overview" },
  { title: "p95 latency", row: "Overview" },
  { title: "Pods ready", row: "Overview" },
  { title: "Requests by pod", row: "Traffic" },
  { title: "Latency by route", row: "Traffic" },
  { title: "Errors by route", row: "Traffic" },
  { title: "DB pool in use", row: "Internals" },
  { title: "Queue depth", row: "Internals" },
  { title: "Payment success", row: "Internals" },
  { title: "Reservations/s", row: "Internals" },
  { title: "Cache hit ratio", row: "Internals" },
] as const

const BUILT_ROWS = new Set(BUILT_PANELS.map(({ row }) => row)).size

export const PANEL_COUNT: number = BUILT_PANELS.length
export const SAVE_MS = 420
export const RAIL_ROWS = 6

export type PlayPhase = "ready" | "playing" | "done"
export type RailLine = { text: string; tone: "active" | "done" }

const SCRIPT: readonly string[] = [
  'Listed 12 metric families in {job="checkout"} on prom-prod',
  "Listed 3 label values on prom-prod",
  "Ran a query on prom-prod: 3 series",
  ...BUILT_PANELS.map(({ title, row }, i) => `Saved panel ${i + 1} of ${PANEL_COUNT}: ${title} (row ${row})`),
  `Saved version 1 (${BUILT_ROWS} rows, ${PANEL_COUNT} panels)`,
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
