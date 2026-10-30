export const THEME_STORAGE_KEY = "slashobserve-theme"

export type Theme = "light" | "dark"

export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null
}

export function resolveTheme(stored: unknown, prefersLight: boolean): Theme {
  return parseTheme(stored) ?? (prefersLight ? "light" : "dark")
}

export function nextTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light"
}
