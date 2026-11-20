export interface TourStop {
  id: string
  place: string
}

export interface TourLink {
  href: string
  label: string
}

export interface TourStopContent extends TourStop {
  title: string
  text: string
  note?: string
  links: readonly TourLink[]
}

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]

export function tourTitle(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count)
  return `One workspace, ${word} ${count === 1 ? "place" : "places"} to stand.`
}

export function tabId(stopId: string): string {
  return `${stopId}-tab`
}

export function tabForKey(key: string, current: number, count: number): number | null {
  if (count === 0) return null
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count
    case "ArrowLeft":
      return (current - 1 + count) % count
    case "Home":
      return 0
    case "End":
      return count - 1
  }
  return null
}

export function stopForHash(hash: string, ids: readonly string[]): number | null {
  const index = ids.indexOf(hash.replace(/^#/, ""))
  return index === -1 ? null : index
}
