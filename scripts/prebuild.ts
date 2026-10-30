import { existsSync } from "node:fs"
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import type { CorpusEntry } from "../src/lib/import-corpus"
import { assertSiteSafe } from "./reference/markdown"
import { apiPages } from "./reference/openapi"
import { observespecPages, type Example } from "./reference/observespec"
import { summarizeConformance, type AreaInput } from "./sync/conformance"
import { summarizeGolden } from "./sync/corpus"
import { transformPage } from "./sync/markdown"
import {
  API_DIR,
  API_SOURCE,
  CONFORMANCE_SOURCE,
  CORPUS_GOLDEN_SOURCE,
  CORPUS_OUT,
  COVERAGE_OUT,
  DOCS_OUT,
  OBSERVESPEC_DIR,
  SCHEMA_OUT,
  SCHEMA_SOURCE,
  SPEC_EXAMPLES_SOURCE,
  invalidDocPath,
  outputPathFor,
} from "./sync/paths"
import { docDates } from "./sync/updated"

const SCHEMA_ID = "https://slashobserve.com/schemas/observespec.v0.json"

function coreDir(): string {
  return path.resolve(process.env.SLASHOBSERVE_CORE_DIR ?? "../slashobserve")
}

function requireCore(core: string): void {
  const missing = [
    "docs",
    SCHEMA_SOURCE,
    SPEC_EXAMPLES_SOURCE,
    CORPUS_GOLDEN_SOURCE,
    CONFORMANCE_SOURCE,
    `${API_SOURCE}/openapi.yaml`,
  ].filter((entry) => !existsSync(path.join(core, entry)))
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

async function listGoldens(goldenDir: string): Promise<string[]> {
  const sources = (await readdir(goldenDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const perSource = await Promise.all(
    sources.map(async (source) =>
      (await readdir(path.join(goldenDir, source), { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => `${source}/${entry.name}`),
    ),
  )
  return perSource.flat().sort()
}

async function summarizeGoldens(goldenDir: string): Promise<CorpusEntry[]> {
  const rels = await listGoldens(goldenDir)
  if (rels.length === 0) throw new Error(`no import goldens found in ${goldenDir}`)
  return Promise.all(
    rels.map(async (rel) =>
      summarizeGolden(rel, JSON.parse(await readFile(path.join(goldenDir, rel), "utf8"))),
    ),
  )
}

async function readConformance(conformanceDir: string): Promise<AreaInput[]> {
  const areas = (await readdir(conformanceDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  return Promise.all(
    areas.map(async (area) => {
      const areaDir = path.join(conformanceDir, area)
      const catalogFile = path.join(areaDir, "catalog.json")
      if (!existsSync(catalogFile)) throw new Error(`${area}: catalog.json missing in ${areaDir}`)
      const gapsDir = path.join(areaDir, "gaps")
      const gapFiles = existsSync(gapsDir)
        ? (await readdir(gapsDir, { withFileTypes: true }))
            .filter((entry) => entry.isFile())
            .map((entry) => entry.name)
        : []
      return { area, catalog: JSON.parse(await readFile(catalogFile, "utf8")), gapFiles }
    }),
  )
}

async function readExamples(examplesDir: string): Promise<Example[]> {
  const files = (await readdir(examplesDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort()
  return Promise.all(
    files.map(async (file) => ({
      file,
      spec: JSON.parse(await readFile(path.join(examplesDir, file), "utf8")),
    })),
  )
}

async function readApiFiles(apiDir: string): Promise<Map<string, unknown>> {
  const pathsDir = path.join(apiDir, "paths")
  const names = (await readdir(pathsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => entry.name)
    .sort()
  const entries = [
    ["openapi.yaml", path.join(apiDir, "openapi.yaml")],
    ...names.map((name) => [`paths/${name}`, path.join(pathsDir, name)]),
  ] as const
  return new Map(
    await Promise.all(
      entries.map(async ([key, file]) => [key, Bun.YAML.parse(await readFile(file, "utf8"))] as const),
    ),
  )
}

function collidesWithGenerated(rel: string): string | null {
  if (rel === `${OBSERVESPEC_DIR}.md` || rel.startsWith(`${OBSERVESPEC_DIR}/`)) return "ObserveSpec"
  if (rel === `${API_DIR}.md` || rel.startsWith(`${API_DIR}/`)) return "HTTP API"
  return null
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

async function prebuild(): Promise<string> {
  const core = coreDir()
  requireCore(core)
  const docsDir = path.join(core, "docs")

  const rels = await listDocs(docsDir)
  const invalid = rels.flatMap((rel) => invalidDocPath(rel) ?? [])
  if (invalid.length > 0) throw new Error(invalid.join("\n"))
  for (const rel of rels) {
    const generated = collidesWithGenerated(rel)
    if (generated !== null) {
      throw new Error(`docs/${rel} collides with the generated ${generated} reference; rename the core page`)
    }
  }

  const schemaSource = path.join(core, SCHEMA_SOURCE)
  const schema = JSON.parse(await readFile(schemaSource, "utf8"))
  const schemaId = schema.$id
  if (schemaId !== SCHEMA_ID) {
    throw new Error(`${SCHEMA_SOURCE} has $id ${schemaId}, expected ${SCHEMA_ID}`)
  }

  const pages = rels.filter((rel) => rel.endsWith(".md"))
  const assets = rels.filter((rel) => !rel.endsWith(".md"))
  const dates = docDates(core)
  const transformed = await Promise.all(
    pages.map(async (rel) => ({
      rel,
      text: transformPage(
        await readFile(path.join(docsDir, rel), "utf8"),
        rel,
        dates.get(rel) ?? null,
      ),
    })),
  )
  const dated = pages.filter((rel) => dates.has(rel)).length

  const corpus = await summarizeGoldens(path.join(core, CORPUS_GOLDEN_SOURCE))
  const conformance = summarizeConformance(
    await readConformance(path.join(core, CONFORMANCE_SOURCE)),
  )
  const commit = coreCommit(core)
  const reference = observespecPages(
    schema,
    await readExamples(path.join(core, SPEC_EXAMPLES_SOURCE)),
    commit,
  )
  reference.forEach(assertSiteSafe)
  const api = apiPages(await readApiFiles(path.join(core, API_SOURCE)), commit)
  api.forEach(assertSiteSafe)

  await rm(DOCS_OUT, { recursive: true, force: true })
  await rm(path.dirname(SCHEMA_OUT), { recursive: true, force: true })
  for (const { rel, text } of transformed) {
    const out = outputPathFor(rel)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, text)
  }
  for (const page of reference) {
    const out = outputPathFor(`${OBSERVESPEC_DIR}/${page.path}`)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, page.markdown)
  }
  for (const page of api) {
    const out = outputPathFor(`${API_DIR}/${page.path}`)
    await mkdir(path.dirname(out), { recursive: true })
    await writeFile(out, page.markdown)
  }
  for (const rel of assets) await copyInto(path.join(docsDir, rel), outputPathFor(rel))
  await copyInto(schemaSource, SCHEMA_OUT)

  await mkdir(path.dirname(CORPUS_OUT), { recursive: true })
  await writeFile(CORPUS_OUT, JSON.stringify({ core: commit, entries: corpus }, null, 2) + "\n")

  await writeFile(COVERAGE_OUT, JSON.stringify({ core: commit, ...conformance }, null, 2) + "\n")

  return `Prebuild: ${plural(pages.length, "page")} (${plural(dated, "dated page")}), ${plural(assets.length, "asset")}, ${plural(reference.length, "ObserveSpec reference page")}, ${plural(api.length, "HTTP API reference page")}, the ObserveSpec schema, ${plural(corpus.length, "corpus file")} and ${plural(conformance.areas.length, "conformance area")} from ${core} (${commit})`
}

try {
  console.log(await prebuild())
} catch (error) {
  console.error(`prebuild: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
