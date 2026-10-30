import { describe, expect, test } from "bun:test"
import { apiPages } from "./openapi"

const spec = {
  openapi: "3.0.3",
  servers: [{ url: "/api/v1" }],
  security: [{ sessionCookie: [] }, { bearerKey: [] }],
  paths: {
    "/things": { $ref: "./paths/things.yaml#/things" },
    "/things/{id}": { $ref: "./paths/things.yaml#/things-id" },
  },
  components: {
    securitySchemes: {
      sessionCookie: { type: "apiKey", in: "cookie", name: "so_session", description: "Session token." },
      bearerKey: { type: "http", scheme: "bearer", description: "Service-account key." },
    },
    schemas: {
      Error: { type: "object", required: ["error"], properties: { error: { type: "string" } } },
      Thing: {
        type: "object",
        description: "A thing | with a pipe.",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" },
          role: { allOf: [{ $ref: "#/components/schemas/Kind" }], description: "What it is." },
        },
      },
      Kind: { type: "string", enum: ["a", "b"] },
    },
    responses: {
      NotFound: {
        description: "No such thing.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
}

const things = {
  things: {
    parameters: [{ name: "team", in: "query", schema: { type: "string" }, description: "Team id." }],
    get: {
      summary: "List things.",
      description: "Returns `user:<uuid>` things for user:<uuid> callers.",
      security: [],
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
      ],
      responses: {
        "200": {
          description: "The things.",
          content: {
            "application/json": {
              schema: { type: "array", items: { $ref: "../openapi.yaml#/components/schemas/Thing" } },
            },
          },
        },
        "404": { $ref: "../openapi.yaml#/components/responses/NotFound" },
      },
    },
    post: {
      summary: "Create a thing.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", description: "Display name." },
                size: { type: "integer", minimum: 1, maximum: 9 },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Created.",
          content: { "application/json": { schema: { $ref: "../openapi.yaml#/components/schemas/Thing" } } },
        },
      },
    },
  },
  "things-id": {
    get: {
      summary: "Stream a thing.",
      responses: {
        "200": { description: "A stream.", content: { "text/event-stream": { schema: { type: "string" } } } },
        "404": { $ref: "../openapi.yaml#/components/responses/NotFound" },
        "403": { description: "Not yours." },
      },
    },
  },
}

const files = (overrides: Record<string, unknown> = {}) =>
  new Map<string, unknown>(Object.entries({ "openapi.yaml": spec, "paths/things.yaml": things, ...overrides }))

const pageAt = (path: string, map = files()) => {
  const page = apiPages(map, "abc1234").find((candidate) => candidate.path === path)
  if (page === undefined) throw new Error(`no page ${path}`)
  return page.markdown
}

describe("apiPages", () => {
  test("writes the overview, one page per path file and the schemas page", () => {
    const pages = apiPages(files(), "abc1234")
    expect(pages.map((page) => page.path)).toEqual(["index.md", "things.md", "schemas.md"])
    expect(pageAt("index.md")).toContain('title: "HTTP API"')
    expect(pageAt("index.md")).toContain('navLabel: "Overview"')
    expect(pageAt("index.md")).toContain("order: 0\n")
    expect(pageAt("things.md")).toContain("order: 100\n")
    expect(pageAt("schemas.md")).toContain("order: 900\n")
    for (const page of pages) expect(page.markdown).toContain('generatedFrom: "api/openapi.yaml"')
  })

  test("links a schema reference from a path file to the schemas page", () => {
    expect(pageAt("things.md")).toContain("[`Thing`](/docs/reference/api/schemas/#thing)")
    expect(pageAt("things.md")).toContain("array of [`Thing`](/docs/reference/api/schemas/#thing)")
  })

  test("lists path-level parameters before the operation's own, with constraints", () => {
    const md = pageAt("things.md")
    expect(md.indexOf("`team`")).toBeGreaterThan(-1)
    expect(md.indexOf("`team`")).toBeLessThan(md.indexOf("`limit`"))
    expect(md).toContain("Between 1 and 200. Default `50`.")
  })

  test("lets an operation parameter replace a path-level one with the same name and place", () => {
    const override = {
      things: { ...things.things, get: { ...things.things.get, parameters: [{ name: "team", in: "query", schema: { type: "integer" } }] } },
      "things-id": things["things-id"],
    }
    const md = pageAt("things.md", files({ "paths/things.yaml": override }))
    expect(md.match(/\| `team`/g)).toHaveLength(2)
    expect(md).toContain("| `team` | query | `integer` |")
  })

  test("says No authentication only on operations with an empty security list", () => {
    const md = pageAt("things.md")
    const [, getSection = "", postSection = ""] = md.split(/^## /m)
    expect(getSection).toContain("No authentication.")
    expect(postSection).not.toContain("No authentication.")
  })

  test("renders an inline request body as a fields table with required and constraints", () => {
    const md = pageAt("things.md")
    expect(md).toContain("`application/json`, required.")
    expect(md).toContain("| `name` (required) | `string` | Display name. |")
    expect(md).toContain("| `size` | `integer` | Between 1 and 9. |")
  })

  test("renders a response from a shared component and its media types", () => {
    const md = pageAt("things.md")
    expect(md).toContain("| `404` | No such thing. | [`Error`](/docs/reference/api/schemas/#error) |")
    expect(md).toContain("| `200` | A stream. | `text/event-stream` |")
    const streamSection = md.split(/^## /m).find((section) => section.startsWith("GET /things/{id}")) ?? ""
    expect(streamSection.indexOf("`403`")).toBeGreaterThan(-1)
    expect(streamSection.indexOf("`403`")).toBeLessThan(streamSection.indexOf("`404`"))
  })

  test("the overview lists the statuses each shared response is used under", () => {
    const md = pageAt("index.md")
    expect(md).toContain("| `404` | No such thing. |")
    expect(md).toContain("Every path is relative to `/api/v1`")
    expect(md).toContain("| `sessionCookie` | `cookie so_session` | Session token. |")
    expect(md).toContain("| `bearerKey` | `Authorization: Bearer` | Service-account key. |")
    expect(md).toContain("Errors return an [`Error`](/docs/reference/api/schemas/#error) body.")
    expect(md).not.toContain("ValidationError")
  })

  test("the overview links every operation to its group page", () => {
    const md = pageAt("index.md")
    expect(md).toContain("### Things")
    expect(md).toContain("| [`GET /things`](/docs/reference/api/things/) | List things. |")
    expect(md).toContain("| [`GET /things/{id}`](/docs/reference/api/things/) | Stream a thing. |")
    expect(pageAt("things.md")).toContain("## POST /things\n")
  })

  test("schemas render a fields table or an enum list", () => {
    const md = pageAt("schemas.md")
    expect(md).toContain("## Thing")
    expect(md).toContain("A thing | with a pipe.")
    expect(md).toContain("| `id` (required) | `string` (uuid) |   |")
    expect(md).toContain("| `role` | [`Kind`](/docs/reference/api/schemas/#kind) | What it is. |")
    expect(md).toContain("One of `a`, `b`.")
  })

  test("escapes an angle bracket outside code and keeps it inside code", () => {
    const md = pageAt("things.md")
    expect(md).toContain("Returns `user:<uuid>` things for user:&lt;uuid> callers.")
  })

  test("titles an unknown path file from its name", () => {
    const pages = apiPages(
      new Map<string, unknown>([
        ["openapi.yaml", { ...spec, paths: { "/x": { $ref: "./paths/outbound-things.yaml#/x" } } }],
        ["paths/outbound-things.yaml", { x: { get: { summary: "X.", responses: {} } } }],
      ]),
      "abc1234",
    )
    expect(pages[1]?.markdown).toContain('title: "Outbound things"')
  })

  test("throws naming the reference and file when a reference does not resolve", () => {
    const broken = {
      ...things,
      things: { get: { summary: "S.", responses: { "200": { $ref: "../openapi.yaml#/components/responses/Gone" } } } },
    }
    expect(() => apiPages(files({ "paths/things.yaml": broken }), "abc1234")).toThrow(
      "openapi: cannot resolve ../openapi.yaml#/components/responses/Gone from paths/things.yaml",
    )
  })

  test("throws when a path file would take the name of a generated page", () => {
    const clash = new Map<string, unknown>([
      ["openapi.yaml", { ...spec, paths: { "/x": { $ref: "./paths/schemas.yaml#/x" } } }],
      ["paths/schemas.yaml", { x: { get: { summary: "X.", responses: {} } } }],
    ])
    expect(() => apiPages(clash, "abc1234")).toThrow("schemas")
  })

  test("throws when a schema name cannot be an anchor", () => {
    const bad = { ...spec, components: { ...spec.components, schemas: { ...spec.components.schemas, "My-Thing": {} } } }
    expect(() => apiPages(files({ "openapi.yaml": bad }), "abc1234")).toThrow("My-Thing")
  })

  test("returns the same output on every call", () => {
    expect(apiPages(files(), "abc1234")).toEqual(apiPages(files(), "abc1234"))
  })
})
