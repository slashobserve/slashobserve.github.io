import { describe, expect, test } from "bun:test"
import { parseTokenBlocks, readTokensCss, themeTokens } from "./tokens"

const lightBlock = `:root,
:root[data-theme="light"] {
  --a: #111111;
  --b: #222222;
}`

const darkBlock = `:root[data-theme="dark"] {
  --a: #eeeeee;
  --b: #dddddd;
}`

const systemBlock = `@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --a: #eeeeee;
    --b: #dddddd;
  }
}`

const sharedBlock = `:root {
  --font: "Geist", sans-serif;
  --a: #999999;
}`

const fixture = [lightBlock, darkBlock, systemBlock, sharedBlock].join("\n\n")

describe("parseTokenBlocks", () => {
  test("reads the four blocks of a tokens file", () => {
    expect(parseTokenBlocks(fixture)).toEqual({
      light: { "--a": "#111111", "--b": "#222222" },
      dark: { "--a": "#eeeeee", "--b": "#dddddd" },
      system: { "--a": "#eeeeee", "--b": "#dddddd" },
      shared: { "--font": '"Geist", sans-serif', "--a": "#999999" },
    })
  })

  test("throws when the system block is missing", () => {
    const withoutSystem = [lightBlock, darkBlock, sharedBlock].join("\n\n")
    expect(() => parseTokenBlocks(withoutSystem)).toThrow("tokens.css: no system block")
  })
})

describe("themeTokens", () => {
  test("lets the theme block override shared tokens", () => {
    expect(themeTokens(fixture, "light")["--a"]).toBe("#111111")
    expect(themeTokens(fixture, "dark")["--a"]).toBe("#eeeeee")
    expect(themeTokens(fixture, "dark")["--font"]).toBe('"Geist", sans-serif')
  })
})

describe("tokens.css", () => {
  const blocks = parseTokenBlocks(readTokensCss())

  test("the system-preference block copies the dark block", () => {
    expect(blocks.system).toEqual(blocks.dark)
  })

  test("light and dark define the same tokens", () => {
    expect(Object.keys(blocks.light).sort()).toEqual(Object.keys(blocks.dark).sort())
  })

  test("no shadow, halo or gridline tokens remain", () => {
    for (const name of Object.keys(blocks.light)) {
      expect(name).not.toMatch(/shadow|halo|gridline/)
    }
  })

  test("the card, muted and accent container tokens have no alias names", () => {
    for (const alias of ["--surface", "--muted-bg", "--sel", "--brand-muted"]) {
      expect(blocks.light).not.toHaveProperty(alias)
    }
  })

  test("both font stacks start with the self-hosted Geist variable fonts", () => {
    expect(blocks.shared["--font-sans"]).toStartWith('"Geist Variable"')
    expect(blocks.shared["--font-mono"]).toStartWith('"Geist Mono Variable"')
  })
})
