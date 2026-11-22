import { describe, expect, test } from "bun:test"
import { chartAppVersion } from "./core-release"

describe("chartAppVersion", () => {
  test("reads a quoted appVersion", () => {
    expect(chartAppVersion('name: slashobserve\nversion: 0.1.4\nappVersion: "0.1.4"\n')).toBe("0.1.4")
  })

  test("reads an unquoted appVersion", () => {
    expect(chartAppVersion("appVersion: 1.2.3\n")).toBe("1.2.3")
  })

  test("ignores the chart version", () => {
    expect(chartAppVersion("version: 0.1.4\n")).toBeNull()
  })

  test("is null for a value that is not a release number", () => {
    expect(chartAppVersion('appVersion: "main"\n')).toBeNull()
  })
})
