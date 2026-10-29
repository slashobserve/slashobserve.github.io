import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const SCHEMA_PATH = "public/schemas/observespec.v0.json"

export function dataPanelTypeCount(schema: unknown): number {
  const types = (schema as any)?.$defs?.dataPanel?.properties?.type?.enum
  if (!Array.isArray(types)) {
    throw new Error("observespec schema: $defs.dataPanel.properties.type.enum not found")
  }
  return types.length
}

export function readSyncedSchema(): unknown {
  const path = join(process.cwd(), SCHEMA_PATH)
  if (!existsSync(path)) {
    throw new Error(`${SCHEMA_PATH} missing: run bun run sync`)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}
