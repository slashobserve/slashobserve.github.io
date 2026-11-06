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
export const BUILD_TITLE = "Checkout health"

export type PlayPhase = "ready" | "playing" | "done"
export type TimelinePhase = { label: string; tools: string; messages: string[] }

interface Step {
  phase: string
  tool: string
  message: string
}

const DATASOURCE = "prom"

const DISCOVERY: readonly Step[] = [
  { phase: "Discovering", tool: "list_metrics", message: `Listed 12 metric families in {job="checkout"} on ${DATASOURCE}` },
  { phase: "Discovering", tool: "list_label_values", message: `Listed 3 label values on ${DATASOURCE}` },
  { phase: "Running queries", tool: "query_range", message: `Ran a query on ${DATASOURCE}: 3 series` },
]

function saveMessage(index: number): string {
  const { title, row } = BUILT_PANELS[index]
  const saved = `Saved panel ${index + 1} of ${PANEL_COUNT}: ${title} (row ${row})`
  return index === PANEL_COUNT - 1 ? `${saved}, then saved version 1 (${BUILT_ROWS} rows, ${PANEL_COUNT} panels)` : saved
}

const SAVES: readonly Step[] = BUILT_PANELS.map((_, index) => ({
  phase: "Saving",
  tool: index === 0 ? "create_dashboard" : "update_panels",
  message: saveMessage(index),
}))

const TOTAL_STEPS = DISCOVERY.length + SAVES.length
const DISCOVERY_SECONDS = 2
const SECONDS_PER_SAVE = 3

function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), PANEL_COUNT)
}

function toolText(steps: readonly Step[]): string {
  const counts = new Map<string, number>()
  for (const { tool } of steps) counts.set(tool, (counts.get(tool) ?? 0) + 1)
  return [...counts].map(([tool, count]) => (count > 1 ? `${tool} ${count}` : tool)).join(", ")
}

export function timeline(step: number): TimelinePhase[] {
  const steps = [...DISCOVERY, ...SAVES.slice(0, clampStep(step))]
  const runs: Step[][] = []
  for (const current of steps) {
    const run = runs.at(-1)
    if (run && run[0].phase === current.phase) run.push(current)
    else runs.push([current])
  }
  return runs.map((run) => ({
    label: run[0].phase,
    tools: toolText(run),
    messages: run.map(({ message }) => message),
  }))
}

export function buildStatus(step: number): string {
  const at = clampStep(step)
  return at === 0 ? "Building the dashboard" : `Building, ${at} of ${PANEL_COUNT} panels`
}

function elapsedSeconds(step: number): number {
  return DISCOVERY_SECONDS + SECONDS_PER_SAVE * clampStep(step)
}

export function runningFor(step: number): string {
  return `Running for ${elapsedSeconds(step)}s`
}

export function stepSummary(): string {
  return `Ran ${TOTAL_STEPS} steps in ${elapsedSeconds(PANEL_COUNT)}s`
}

export function topRowTitle(step: number): string {
  return clampStep(step) === 0 ? "New dashboard" : BUILD_TITLE
}

export function composerText(done: boolean): { placeholder: string; note: string } {
  return done
    ? { placeholder: `Ask for another change to ${BUILD_TITLE}`, note: "Each change is saved as a new version of the dashboard." }
    : { placeholder: "Describe a dashboard, like: checkout health by pod, last 6h", note: "Wait for the dashboard, then ask for changes." }
}

export function panelShown(step: number, panel: number): boolean {
  return step >= panel
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
