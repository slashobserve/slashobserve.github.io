export type Rgba = { r: number; g: number; b: number; a: number }

const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i

export function parseColor(value: string): Rgba {
  const text = value.trim()
  const fromHex = hex.exec(text)
  if (fromHex) {
    const [r, g, b] = fromHex.slice(1).map((part) => parseInt(part, 16))
    return { r, g, b, a: 1 }
  }
  const fromRgba = rgba.exec(text)
  if (fromRgba) {
    const [r, g, b] = fromRgba.slice(1, 4).map(Number)
    return { r, g, b, a: Number(fromRgba[4]) }
  }
  throw new Error(`unsupported colour: ${value}`)
}

export function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (t: number, b: number) => t * top.a + b * (1 - top.a)
  return {
    r: mix(top.r, bottom.r),
    g: mix(top.g, bottom.g),
    b: mix(top.b, bottom.b),
    a: top.a + bottom.a * (1 - top.a),
  }
}

function luminance(color: Rgba): number {
  const linear = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b)
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  if (a.a < 1 || b.a < 1) throw new Error("contrastRatio needs opaque colours")
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
