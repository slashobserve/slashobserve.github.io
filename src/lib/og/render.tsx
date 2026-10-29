import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { Resvg, initWasm } from "@resvg/resvg-wasm"
import satori from "satori"
import { readTokensCss, themeTokens } from "../tokens"
import { CARD_HEIGHT, CARD_WIDTH } from "./cards"
import { cardColors } from "./colors"
import { SocialCardImage } from "./SocialCard"

const resolve = createRequire(path.join(process.cwd(), "package.json")).resolve

const fontFiles = [
  { name: "Geist", file: "@fontsource/geist/files/geist-latin-400-normal.woff", weight: 400 },
  { name: "Geist", file: "@fontsource/geist/files/geist-latin-600-normal.woff", weight: 600 },
  { name: "Geist Mono", file: "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff", weight: 400 },
] as const

let fonts: Promise<Parameters<typeof satori>[1]["fonts"]> | undefined
let wasm: Promise<void> | undefined

function loadFonts() {
  fonts ??= Promise.resolve(
    fontFiles.map(({ name, file, weight }) => ({
      name,
      data: readFileSync(resolve(file)),
      weight,
      style: "normal" as const,
    })),
  )
  return fonts
}

function loadWasm() {
  wasm ??= initWasm(readFileSync(resolve("@resvg/resvg-wasm/index_bg.wasm")))
  return wasm
}

export async function renderCard(card: { section: string; title: string }): Promise<Uint8Array<ArrayBuffer>> {
  const [cardFonts] = await Promise.all([loadFonts(), loadWasm()])
  const colors = cardColors(themeTokens(readTokensCss(), "light"))
  const svg = await satori(<SocialCardImage section={card.section} title={card.title} colors={colors} />, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: cardFonts,
  })
  const png = new Resvg(svg, { fitTo: { mode: "width", value: CARD_WIDTH } }).render().asPng()
  return new Uint8Array(png)
}
