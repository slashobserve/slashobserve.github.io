import { describe, expect, test } from "bun:test"
import { languagesOf, stores } from "./stores"

const languages = (name: string) => languagesOf(stores.find(({ store }) => store === name)!)

describe("languagesOf", () => {
  test("names a language once when a store serves it for several signals", () => {
    expect(languages("ClickHouse")).toBe("SQL")
  })

  test("keeps the order metrics, logs, traces", () => {
    const store = { store: "x", metrics: "PromQL", logs: "LogQL", traces: "TraceQL", discovery: "" }
    expect(languagesOf(store)).toBe("PromQL, LogQL, TraceQL")
  })

  test("lists the languages of a single signal store as one text", () => {
    expect(languages("Elasticsearch")).toBe("KQL, Lucene, Query DSL")
    expect(languages("Tempo")).toBe("TraceQL")
  })

  test("gives every store a language", () => {
    expect(stores.every((store) => languagesOf(store) !== "")).toBe(true)
  })
})
