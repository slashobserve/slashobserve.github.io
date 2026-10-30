import { describe, expect, test } from "bun:test"
import { parseDocDates } from "./updated"

describe("parseDocDates", () => {
  test("keeps the newest date for a path seen in several commits", () => {
    const log =
      "\0" +
      "2026-10-30T10:00:00+05:30\n\ndocs/use/cli.md\ndocs/get-started/quick-start.md\n" +
      "\0" +
      "2026-10-01T09:00:00+05:30\n\ndocs/use/cli.md\ndocs/operate/production.md\n"
    expect(Object.fromEntries(parseDocDates(log))).toEqual({
      "use/cli.md": "2026-10-30T10:00:00+05:30",
      "get-started/quick-start.md": "2026-10-30T10:00:00+05:30",
      "operate/production.md": "2026-10-01T09:00:00+05:30",
    })
  })

  test("ignores paths outside docs", () => {
    const log = "\x002026-10-30T10:00:00+05:30\n\nREADME.md\nspec/schema/a.json\ndocs/use/cli.md\n"
    expect([...parseDocDates(log).keys()]).toEqual(["use/cli.md"])
  })

  test("gives an empty map for empty input", () => {
    expect(parseDocDates("").size).toBe(0)
  })
})
