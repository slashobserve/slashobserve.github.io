export function percentDown(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.floor((part * 100) / whole)
}

export function formatCount(count: number): string {
  return count.toLocaleString("en-US")
}
