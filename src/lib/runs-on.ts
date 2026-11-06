export const PLACES = [
  "AWS",
  "GCP",
  "Azure",
  "Hetzner",
  "DigitalOcean",
  "Fly.io",
  "Linode",
  "Vultr",
  "OVHcloud",
  "Scaleway",
] as const

export const CYCLE_MS = 1800

export function placeAt(tick: number): string {
  const index = ((tick % PLACES.length) + PLACES.length) % PLACES.length
  return PLACES[index]
}

export function spinClass(tick: number): "spin-a" | "spin-b" {
  return Math.abs(tick % 2) === 1 ? "spin-a" : "spin-b"
}
