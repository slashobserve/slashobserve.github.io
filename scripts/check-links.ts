import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { scanHtml, type PageScan } from "./links/extract"
import { candidateFiles, resolveHref } from "./links/resolve"

const DIST = "dist"
const ALWAYS_PRESENT_ANCHORS = new Set(["_top"])

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}

function targetsOf(file: string): string[] {
  return file.endsWith("index.html") ? [file] : candidateFiles(`/${file}`)
}

if (!existsSync(DIST)) {
  console.error("dist/ not found: run bun run build first")
  process.exit(1)
}

const pages = readdirSync(DIST, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".html"))
  .sort()

const scans = new Map<string, PageScan>()
for (const page of pages) scans.set(page, scanHtml(readFileSync(join(DIST, page), "utf8")))

const broken: string[] = []
let checked = 0

for (const [page, scan] of scans) {
  for (const href of scan.links) {
    const resolved = resolveHref(page, href)
    if (resolved.kind === "external") continue
    checked += 1
    const target = targetsOf(resolved.file).find((file) => isFile(join(DIST, file)))
    if (target === undefined) {
      broken.push(`missing: ${page} -> ${href}`)
      continue
    }
    const { fragment } = resolved
    if (fragment === null || !target.endsWith(".html") || ALWAYS_PRESENT_ANCHORS.has(fragment)) continue
    const ids = scans.get(target)?.ids ?? scanHtml(readFileSync(join(DIST, target), "utf8")).ids
    if (!ids.has(fragment)) broken.push(`missing anchor: ${page} -> ${href}`)
  }
}

broken.sort()
console.log(`Checked ${checked} links in ${pages.length} pages: ${broken.length} broken`)
for (const entry of broken) console.log(entry)
process.exit(broken.length > 0 ? 1 : 0)
