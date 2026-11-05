export type SiteVersion = { count: number; sha: string }

export type GitReadings = { count: string | null; sha: string | null; shallow: string | null; githubSha?: string }

const SHORT_SHA = /^[0-9a-f]{7,12}$/
const FULL_SHA = /^[0-9a-f]{40}$/
const POSITIVE_INTEGER = /^[1-9][0-9]*$/

function shortSha(readings: GitReadings): string | null {
  const sha = readings.sha?.trim()
  if (sha !== undefined && SHORT_SHA.test(sha)) return sha
  const githubSha = readings.githubSha?.trim()
  if (githubSha !== undefined && FULL_SHA.test(githubSha)) return githubSha.slice(0, 7)
  return null
}

export function siteVersion(readings: GitReadings): SiteVersion | null {
  if (readings.shallow?.trim() === "true") return null
  const count = readings.count?.trim()
  if (count === undefined || !POSITIVE_INTEGER.test(count)) return null
  const sha = shortSha(readings)
  if (sha === null) return null
  return { count: Number(count), sha }
}
