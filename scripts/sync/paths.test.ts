/// <reference types="bun" />

import { describe, expect, test } from "bun:test"
import { editUrlFor, invalidDocPath, outputPathFor, routeFor } from "./paths"

describe("invalidDocPath", () => {
  test.each([
    ["self-hosting.md", null],
    ["get-started/quick-start.md", null],
    ["get-started/img/flow-1.png", null],
    ["index.md", null],
  ])("accepts %s", (rel, expected) => {
    expect(invalidDocPath(rel)).toBe(expected)
  })

  test.each([
    ["Self-Hosting.md", "Self-Hosting"],
    ["connect/My Page.md", "My Page"],
    ["connect/prom_etheus.md", "prom_etheus"],
    ["Connect/prometheus.md", "Connect"],
    ["connect/double--dash.md", "double--dash"],
    ["connect/-lead.md", "-lead"],
  ])("rejects %s and names %s", (rel, segment) => {
    const reason = invalidDocPath(rel)
    expect(reason).toContain(rel)
    expect(reason).toContain(`"${segment}"`)
  })
})

describe("outputPathFor", () => {
  test.each([
    ["connect/prometheus.md", "src/content/docs/docs/connect/prometheus.md"],
    ["self-hosting.md", "src/content/docs/docs/self-hosting.md"],
    ["get-started/img/flow.png", "src/content/docs/docs/get-started/img/flow.png"],
  ])("maps %s", (rel, expected) => {
    expect(outputPathFor(rel)).toBe(expected)
  })
})

describe("routeFor", () => {
  test.each([
    ["self-hosting.md", "/docs/self-hosting/"],
    ["connect/prometheus.md", "/docs/connect/prometheus/"],
    ["connect/index.md", "/docs/connect/"],
    ["index.md", "/docs/"],
  ])("routes %s", (rel, expected) => {
    expect(routeFor(rel)).toBe(expected)
  })
})

describe("editUrlFor", () => {
  test("points at the file on the main branch of the core repo", () => {
    expect(editUrlFor("connect/prometheus.md")).toBe(
      "https://github.com/slashobserve/slashobserve/edit/main/docs/connect/prometheus.md",
    )
  })
})
