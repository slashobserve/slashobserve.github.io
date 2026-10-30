const GIT_LOG_ARGS = ["log", "--format=%x00%cI", "--name-only", "--", "docs"]

export function parseDocDates(log: string): Map<string, string> {
  const dates = new Map<string, string>()
  for (const record of log.split("\0")) {
    const [date, ...paths] = record.split("\n").filter((line) => line !== "")
    if (date === undefined) continue
    for (const path of paths) {
      if (!path.startsWith("docs/")) continue
      const rel = path.slice("docs/".length)
      if (!dates.has(rel)) dates.set(rel, date)
    }
  }
  return dates
}

function git(core: string, args: string[]): { ok: boolean; out: string } {
  const result = Bun.spawnSync(["git", "-C", core, ...args])
  return { ok: result.exitCode === 0, out: result.stdout.toString() }
}

export function docDates(core: string): Map<string, string> {
  const shallow = git(core, ["rev-parse", "--is-shallow-repository"])
  if (!shallow.ok || shallow.out.trim() !== "false") return new Map()
  const log = git(core, GIT_LOG_ARGS)
  return log.ok ? parseDocDates(log.out) : new Map()
}
