import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { SiteVersion } from "../../scripts/sync/site-version"

export type SiteFacts = { version: SiteVersion | null; release: string | null }

export const SITE_FACTS_PATH = "src/generated/site.json"

export const INSTALL_COMMAND = "curl -fsSL https://slashobserve.com/install.sh | sh"

export const RELEASE_NOTES_URL = "https://github.com/slashobserve/slashobserve/releases"

export function commitLine(facts: SiteFacts): string | null {
  return facts.version === null ? null : facts.version.sha
}

export function isBeforeOneDotZero(release: string): boolean {
  return release.startsWith("0.")
}

export function releaseLabel(facts: SiteFacts): string | null {
  return facts.release === null ? null : `v${facts.release}`
}

export function showsPreReleaseNotice(facts: SiteFacts): boolean {
  return facts.release === null || isBeforeOneDotZero(facts.release)
}

export function readSiteFacts(): SiteFacts {
  const path = join(process.cwd(), SITE_FACTS_PATH)
  if (!existsSync(path)) {
    throw new Error(`${SITE_FACTS_PATH} missing: run bun scripts/prebuild.ts`)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}
