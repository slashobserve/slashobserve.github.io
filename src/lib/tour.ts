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

export interface RailItem {
  id: string
  label: string
  href: string
}

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]

export function railItems(stops: readonly TourStop[]): RailItem[] {
  return stops.map(({ id, place }) => ({ id, label: place, href: `#${id}` }))
}

export function tourTitle(count: number): string {
  const word = COUNT_WORDS[count] ?? String(count)
  return `One workspace, ${word} ${count === 1 ? "place" : "places"} to stand.`
}

export function activeStop(tops: readonly number[], line: number): number {
  let active = 0
  tops.forEach((top, index) => {
    if (top <= line) active = index
  })
  return active
}
