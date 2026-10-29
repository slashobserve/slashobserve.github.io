import { describe, expect, test } from "bun:test"
import { dataPanelTypeCount } from "./schema-facts"

const notFound = "observespec schema: $defs.dataPanel.properties.type.enum not found"

function schemaWithTypes(types: unknown) {
  return { $defs: { dataPanel: { properties: { type: { enum: types } } } } }
}

describe("dataPanelTypeCount", () => {
  test("counts the data panel types in the schema", () => {
    expect(dataPanelTypeCount(schemaWithTypes(["timeseries", "stat", "gauge"]))).toBe(3)
  })

  test("throws when the schema has no definitions", () => {
    expect(() => dataPanelTypeCount({})).toThrow(notFound)
  })

  test("throws when the type list is not an array", () => {
    expect(() => dataPanelTypeCount(schemaWithTypes("timeseries"))).toThrow(notFound)
  })

  test("throws when the schema is not an object", () => {
    expect(() => dataPanelTypeCount(null)).toThrow(notFound)
  })
})
