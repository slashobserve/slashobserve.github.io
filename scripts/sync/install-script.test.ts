import { describe, expect, test } from "bun:test"
import { isInstallScript } from "./install-script"

describe("isInstallScript", () => {
  test("accepts a POSIX shell script", () => {
    expect(isInstallScript("#!/bin/sh\nset -eu\n")).toBe(true)
  })

  test.each([
    ["nothing", null],
    ["an empty body", ""],
    ["an HTML 404 page", "<!DOCTYPE html>\n<html></html>"],
    ["a plain 404 body", "404: Not Found"],
    ["a bash script", "#!/bin/bash\nset -eu\n"],
  ])("rejects %s", (_, text) => {
    expect(isInstallScript(text)).toBe(false)
  })
})
