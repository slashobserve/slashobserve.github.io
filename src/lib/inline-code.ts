export type InlineSegment = { code: boolean; text: string }

const CODE_SPAN = /`([^`]+)`/g

export function inlineCodeSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(CODE_SPAN)) {
    segments.push({ code: false, text: text.slice(cursor, match.index) })
    segments.push({ code: true, text: match[1] })
    cursor = match.index + match[0].length
  }
  segments.push({ code: false, text: text.slice(cursor) })
  return segments.filter((segment) => segment.text !== "")
}
