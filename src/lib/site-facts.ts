import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { SiteVersion } from "../../scripts/sync/site-version"

export type SiteFacts = { version: SiteVersion | null }

export const SITE_FACTS_PATH = "src/generated/site.json"

export const INSTALL_COMMAND = "curl -fsSL https://slashobserve.com/install.sh | sh"

export function versionLine(facts: SiteFacts): string | null {
  return facts.version === null ? null : `site version ${facts.version.count} · ${facts.version.sha}`
}

export function readSiteFacts(): SiteFacts {
  const path = join(process.cwd(), SITE_FACTS_PATH)
  if (!existsSync(path)) {
    throw new Error(`${SITE_FACTS_PATH} missing: run bun scripts/prebuild.ts`)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}
