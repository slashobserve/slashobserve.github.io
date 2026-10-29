import { posix } from "node:path"

export const SITE_ORIGIN = "https://slashobserve.com"

export type Resolved =
  | { kind: "external" }
  | { kind: "internal"; file: string; fragment: string | null }

const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function candidateFiles(path: string): string[] {
  const relative = path.replace(/^\/+/, "")
  if (relative === "" || relative.endsWith("/")) return [`${relative}index.html`]
  return [relative, `${relative}.html`, `${relative}/index.html`]
}

function internalPath(fromPage: string, href: string): { path: string | null; fragment: string | null } {
  const hashAt = href.indexOf("#")
  const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt)
  const rawFragment = hashAt === -1 ? "" : href.slice(hashAt + 1)
  const fragment = rawFragment === "" ? null : decode(rawFragment)
  const queryAt = beforeHash.indexOf("?")
  const rawPath = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt)
  if (rawPath === "") return { path: null, fragment }
  const decoded = decode(rawPath)
  const path = decoded.startsWith("/")
    ? posix.normalize(decoded)
    : posix.join(posix.dirname(`/${fromPage}`), decoded)
  return { path, fragment }
}

export function resolveHref(fromPage: string, href: string): Resolved {
  const trimmed = href.trim()
  if (trimmed.startsWith("//")) return { kind: "external" }
  let local = trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed)
    if (url.origin !== SITE_ORIGIN) return { kind: "external" }
    local = `${url.pathname}${url.search}${url.hash}`
  } else if (SCHEME.test(trimmed)) {
    return { kind: "external" }
  }
  const { path, fragment } = internalPath(fromPage, local)
  if (path === null) return { kind: "internal", file: fromPage, fragment }
  return { kind: "internal", file: candidateFiles(path)[0], fragment }
}
