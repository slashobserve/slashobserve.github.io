import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type Tokens = Record<string, string>
export type ThemeBlocks = { light: Tokens; dark: Tokens; system: Tokens; shared: Tokens }

const tokensPath = "src/styles/tokens.css"

function blockName(selector: string): keyof ThemeBlocks | null {
  if (selector.includes(':root[data-theme="light"]')) return "light"
  if (selector === ':root[data-theme="dark"]') return "dark"
  if (selector === ":root:not([data-theme])") return "system"
  if (selector === ":root") return "shared"
  return null
}

function parseDeclarations(body: string): Tokens {
  const tokens: Tokens = {}
  for (const declaration of body.split(";")) {
    const colon = declaration.indexOf(":")
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    if (!name.startsWith("--")) continue
    tokens[name] = declaration.slice(colon + 1).trim()
  }
  return tokens
}

export function parseTokenBlocks(css: string): ThemeBlocks {
  const found: Partial<ThemeBlocks> = {}
  for (const [, rawSelector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rawSelector.replace(/\s+/g, " ").trim()
    const name = blockName(selector)
    if (name) found[name] = parseDeclarations(body)
  }
  for (const name of ["light", "dark", "system", "shared"] as const) {
    if (!found[name]) throw new Error(`tokens.css: no ${name} block`)
  }
  return found as ThemeBlocks
}

export function themeTokens(css: string, theme: "light" | "dark"): Tokens {
  const blocks = parseTokenBlocks(css)
  return { ...blocks.shared, ...blocks[theme] }
}

export function readTokensCss(): string {
  const path = join(process.cwd(), tokensPath)
  if (!existsSync(path)) throw new Error(`${tokensPath} missing`)
  return readFileSync(path, "utf8")
}
