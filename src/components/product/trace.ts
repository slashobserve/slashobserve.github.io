export interface Span {
  service: string
  operation: string
  depth: 0 | 1 | 2 | 3
  tone: "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "crit"
  width: number
  offset: number
  duration: string
  error?: boolean
  selected?: boolean
}

export const CHECKOUT_SPAN_ID = "5b2d4f6a8c0e1d3b"
export const PAYMENT_SPAN_ID = "9f2c1a7b3e4d5f60"
export const PAYMENT_FAILED = "Payment request failed. Invalid token. demo.user_context.loyalty_level=gold"
export const CHARGE_FAILED = `failed to charge card: rpc error: code = Unknown desc = ${PAYMENT_FAILED}`

export const SPANS: Span[] = [
  { service: "frontend-proxy", operation: "ingress", depth: 0, tone: "crit", width: 100, offset: 0, duration: "192 ms", error: true },
  { service: "frontend", operation: "POST /api/checkout", depth: 1, tone: "crit", width: 98, offset: 1, duration: "188 ms", error: true },
  {
    service: "checkout",
    operation: "oteldemo.CheckoutService/PlaceOrder",
    depth: 2,
    tone: "crit",
    width: 92,
    offset: 3,
    duration: "176 ms",
    error: true,
  },
  { service: "cart", operation: "oteldemo.CartService/GetCart", depth: 3, tone: "s6", width: 18, offset: 5, duration: "34 ms" },
  { service: "currency", operation: "oteldemo.CurrencyService/Convert", depth: 3, tone: "s7", width: 6, offset: 24, duration: "12 ms" },
  { service: "shipping", operation: "oteldemo.ShippingService/GetQuote", depth: 3, tone: "s4", width: 20, offset: 32, duration: "38 ms" },
  {
    service: "payment",
    operation: "oteldemo.PaymentService/Charge",
    depth: 3,
    tone: "crit",
    width: 30,
    offset: 56,
    duration: "58 ms",
    error: true,
    selected: true,
  },
]

export const ROOT = SPANS[0]

export const SERVICES = [
  { name: "frontend-proxy", tone: "s1", count: 1 },
  { name: "frontend", tone: "s5", count: 1 },
  { name: "checkout", tone: "s3", count: 1 },
  { name: "cart", tone: "s6", count: 1 },
  { name: "currency", tone: "s7", count: 1 },
  { name: "shipping", tone: "s4", count: 1 },
  { name: "payment", tone: "s2", count: 1 },
] as const
export const TRACE_START = "2026-11-22 16:46:09.378"

export function hasChildren(index: number): boolean {
  return (SPANS[index + 1]?.depth ?? -1) > SPANS[index].depth
}
export const SLOWEST_ON_CRITICAL_PATH = { service: "payment", duration: "58 ms" }

export const TICKS = ["0 ms", "48 ms", "96 ms", "144 ms", "192 ms"]

export const SELECTED_SPAN = {
  id: PAYMENT_SPAN_ID,
  start: "2026-11-22 16:46:09.485",
  share: "30%",
  startsAt: "+107 ms",
  statusMessage: PAYMENT_FAILED,
  attributes: [
    ["rpc.system", "grpc"],
    ["rpc.method", "Charge"],
    ["rpc.grpc.status_code", "2"],
    ["service.name", "payment"],
    ["service.namespace", "opentelemetry-demo"],
  ],
}
