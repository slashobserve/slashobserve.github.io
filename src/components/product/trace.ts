export interface Span {
  service: string
  operation: string
  depth: 0 | 1 | 2 | 3
  tone: "s1" | "s2" | "s3" | "s4" | "crit"
  width: number
  offset: number
  duration: string
  error?: boolean
  selected?: boolean
}

export const SPANS: Span[] = [
  { service: "frontend", operation: "POST /checkout", depth: 0, tone: "crit", width: 100, offset: 0, duration: "2.31 s", error: true },
  { service: "checkout", operation: "place_order", depth: 1, tone: "crit", width: 86, offset: 6, duration: "1.98 s", error: true },
  { service: "inventory", operation: "reserve", depth: 2, tone: "s4", width: 9, offset: 8, duration: "210 ms" },
  { service: "checkout", operation: "db.query", depth: 2, tone: "s3", width: 4, offset: 18, duration: "90 ms" },
  {
    service: "payments",
    operation: "POST /charge",
    depth: 2,
    tone: "crit",
    width: 66,
    offset: 24,
    duration: "1.52 s",
    error: true,
    selected: true,
  },
  { service: "payments", operation: "authorize_card", depth: 3, tone: "crit", width: 64, offset: 25, duration: "1.49 s", error: true },
  { service: "frontend", operation: "render", depth: 1, tone: "s1", width: 5, offset: 93, duration: "110 ms" },
]

export const ROOT = SPANS[0]
export const TRACE_START = "2026-11-06 14:02:09.112"
export const LOG_LINK_RANGE = "2026-11-06 13:02:09 to 2026-11-06 15:02:09"

export function hasChildren(index: number): boolean {
  return (SPANS[index + 1]?.depth ?? -1) > SPANS[index].depth
}
export const TICKS = ["0 ms", "577.5 ms", "1.16 s", "1.73 s", "2.31 s"]

export const SELECTED_SPAN = {
  id: "9f2c1a7b3e4d5f60",
  start: "2026-11-06 14:02:09.663",
  attributes: [
    ["http.request.method", "POST"],
    ["http.response.status_code", "504"],
    ["server.address", "gateway.psp.example"],
    ["k8s.pod.name", "payments-0"],
    ["service.name", "payments"],
  ],
}
