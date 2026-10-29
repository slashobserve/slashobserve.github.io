import type { Tokens } from "../tokens"

export type CardColors = {
  bg: string
  fg: string
  mfg: string
  brand: string
  border: string
  halo: string
  gridline: string
}

const tokenNames: Record<keyof CardColors, string> = {
  bg: "--bg",
  fg: "--fg",
  mfg: "--mfg",
  brand: "--brand",
  border: "--border",
  halo: "--halo",
  gridline: "--gridline",
}

export function cardColors(light: Tokens): CardColors {
  const colors = {} as CardColors
  for (const key of Object.keys(tokenNames) as (keyof CardColors)[]) {
    const name = tokenNames[key]
    const value = light[name]
    if (value === undefined) throw new Error(`tokens.css: ${name} missing for the social card`)
    colors[key] = value
  }
  return colors
}
