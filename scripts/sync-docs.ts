/// <reference types="bun" />

import { existsSync } from "node:fs"
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { transformPage } from "./sync/markdown"
import {
  DOCS_OUT,
  SCHEMA_OUT,
  SCHEMA_SOURCE,
  invalidDocPath,
  outputPathFor,
} from "./sync/paths"

const SCHEMA_ID = "https://slashobserve.com/schemas/observespec.v0.json"

function coreDir(): string {
  return path.resolve(process.env.SLASHOBSERVE_CORE_DIR ?? "../slashobserve")
}

function requireCore(core: string): void {
  const missing = ["docs", SCHEMA_SOURCE].filter(
    (entry) => !existsSync(path.join(core, entry)),
  )
  if (missing.length === 0) return
  throw new Error(
    `core repo not found at ${core} (missing ${missing.join(", ")}): set SLASHOBSERVE_CORE_DIR to a checkout of slashobserve/slashobserve, or clone it next to this repo as ../slashobserve`,
  )
}

async function listDocs(docsDir: string): Promise<string[]> {
  const entries = await readdir(docsDir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(docsDir, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/"),
    )
    .filter((rel) => !rel.split("/").some((segment) => segment.startsWith(".")))
    .sort()
}

function coreCommit(core: string): string {
  const result = Bun.spawnSync(["git", "-C", core, "rev-parse", "--short", "HEAD"])
  return result.exitCode === 0 ? result.stdout.toString().trim() : "unknown"
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

async function copyInto(source: string, out: string): Promise<void> {
  await mkdir(path.dirname(out), { recursive: true })
  await cp(source, out)
}

async function sync(): Promise<string> {
  const core = coreDir()
  requireCore(core)
  const docsDir = path.join(core, "docs")

  const rels = await listDocs(docsDir)
  const invalid = rels.flatMap((rel) => invalidDocPath(rel) ?? [])
  if (invalid.length > 0) throw new Error(invalid.join("\n"))

  const schemaSource = path.join(core, SCHEMA_SOURCE)
  const schemaId = JSON.parse(await readFile(schemaSource, "utf8")).$id
  if (schemaId !== SCHEMA_ID) {
    throw new Error(`${SCHEMA_SOURCE} has $id ${schemaId}, expected ${SCHEMA_ID}`)
  }

  const pages = rels.filter((rel) => rel.endsWith(".md"))
  const assets = rels.filter((rel) => !rel.endsWith(".md"))
  const transformed = await Promise.all(
    pages.map(async (rel) => ({
      rel,
      text: transformPage(await readFile(path.join(docsDir, rel), "utf8"), rel),
    })),
  )

  await rm(DOCS_OUT, { recursive: true, force: true })
  await rm(path.dirname(SCHEMA_OUT), { recursive: true, force: true })
  for (const { rel, text } of transformed) {
    const out = outputPathFor(rel)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, text)
  }
  for (const rel of assets) await copyInto(path.join(docsDir, rel), outputPathFor(rel))
  await copyInto(schemaSource, SCHEMA_OUT)

  return `Synced ${plural(pages.length, "page")}, ${plural(assets.length, "asset")} and the ObserveSpec schema from ${core} (${coreCommit(core)})`
}

try {
  console.log(await sync())
} catch (error) {
  console.error(`sync-docs: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
