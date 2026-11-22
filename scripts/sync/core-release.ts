const APP_VERSION = /^appVersion:\s*"?(\d+\.\d+\.\d+)"?\s*$/m

export function chartAppVersion(chartYaml: string): string | null {
  return APP_VERSION.exec(chartYaml)?.[1] ?? null
}
