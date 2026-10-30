import { posix } from "node:path"
import { API_SOURCE, CORE_REPO_URL } from "../sync/paths"
import {
  cell,
  code,
  constraintNote,
  escapeText,
  frontMatter,
  table,
  typeLabel,
  type GeneratedPage,
} from "./markdown"

export const API_BASE = "/docs/reference/api/"

type Node = Record<string, unknown>
type Files = ReadonlyMap<string, unknown>
type Located = { node: unknown; file: string }
type Scope = { files: Files; file: string }
type Operation = { method: string; path: string; stem: string; file: string; node: Node; pathParameters: unknown }
type PageMeta = { title: string; description: string; navLabel?: string; order: number }

const SPEC_FILE = "openapi.yaml"
const SPEC_SOURCE = `${API_SOURCE}/${SPEC_FILE}`
const SCHEMAS_PAGE = `${API_BASE}schemas/`
const METHODS = ["get", "post", "put", "patch", "delete"]
const SCHEMA_POINTER = /^\/components\/schemas\/([^/]+)$/
const RESPONSE_REF = /#\/components\/responses\/([^/]+)$/
const SCHEMA_NAME = /^[A-Za-z][A-Za-z0-9]*$/
const RESERVED_STEMS = ["index", "schemas"]

const GROUP_TITLES = new Map([
  ["auth", "Sign-in and session"],
  ["service-accounts", "Service accounts"],
  ["users", "People"],
  ["outbound-domains", "Outbound domains"],
  ["prompts", "Saved prompts"],
  ["datasources", "Datasources"],
  ["folders", "Folders"],
  ["dashboards", "Dashboards"],
  ["imports", "Grafana imports"],
  ["events", "Live events"],
  ["comments", "Comments"],
  ["queryproxy", "Panel and variable data"],
  ["preview", "Draft panel preview"],
  ["names", "Metric and label names"],
  ["revisions", "Revision requests"],
  ["suggestions", "Panel suggestions"],
  ["observe", "Agent requests"],
  ["news", "News feeds"],
])

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nodeOr(value: unknown): Node {
  return isNode(value) ? value : {}
}

function textOf(node: Node, key: string): string | undefined {
  const value = node[key]
  return typeof value === "string" ? value : undefined
}

function missing(what: string): never {
  throw new Error(`openapi: missing ${what}`)
}

function resolve(files: Files, ref: string, fromFile: string): Located {
  const fail = (): never => {
    throw new Error(`openapi: cannot resolve ${ref} from ${fromFile}`)
  }
  const [filePart = "", pointer = ""] = ref.split("#")
  const file = filePart === "" ? fromFile : posix.normalize(posix.join(posix.dirname(fromFile), filePart))
  if (!files.has(file)) return fail()
  let node: unknown = files.get(file)
  for (const raw of pointer.split("/").slice(1)) {
    const key = raw.replaceAll("~1", "/").replaceAll("~0", "~")
    node = isNode(node) ? node[key] : undefined
    if (node === undefined) return fail()
  }
  return { node, file }
}

function deref(files: Files, node: unknown, file: string): Located {
  let current: Located = { node, file }
  while (isNode(current.node) && typeof current.node.$ref === "string") {
    current = resolve(files, current.node.$ref, current.file)
  }
  return current
}

function schemaLink(scope: Scope, ref: string): string {
  resolve(scope.files, ref, scope.file)
  const name = SCHEMA_POINTER.exec(ref.split("#")[1] ?? "")?.[1]
  if (name === undefined) throw new Error(`openapi: ${ref} in ${scope.file} is not a schema reference`)
  if (!SCHEMA_NAME.test(name)) throw new Error(`openapi: schema name ${name} must match ${SCHEMA_NAME}`)
  return `[${code(name)}](${SCHEMAS_PAGE}#${name.toLowerCase()})`
}

function labelOf(scope: Scope, schema: unknown): string {
  return typeLabel(flatten(schema), (ref) => schemaLink(scope, ref))
}

function flatten(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(flatten)
  if (!isNode(node)) return node
  const { allOf, ...rest } = node
  if (Array.isArray(allOf) && allOf.length === 1 && isNode(allOf[0])) return flatten({ ...allOf[0], ...rest })
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, flatten(value)]))
}

function describe(node: unknown): string {
  const own = isNode(node) ? (textOf(node, "description") ?? "") : ""
  return [own, constraintNote(node)].filter((part) => part !== "").join(" ")
}

function propertiesOf(schema: unknown): Node | null {
  const properties = isNode(schema) ? schema.properties : undefined
  return isNode(properties) && Object.keys(properties).length > 0 ? properties : null
}

function fieldsTable(scope: Scope, schema: Node): string {
  const required = Array.isArray(schema.required) ? schema.required : []
  const rows = Object.entries(nodeOr(flatten(schema.properties))).map(([name, node]) => [
    cell(`${code(name)}${required.includes(name) ? " (required)" : ""}`),
    cell(labelOf(scope, node)),
    cell(describe(node)),
  ])
  return table(["Field", "Type", "Description"], rows)
}

function compareStatus(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true })
}

function groupTitle(stem: string): string {
  const known = GROUP_TITLES.get(stem)
  if (known !== undefined) return known
  const spaced = stem.replaceAll("-", " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function operationsOf(files: Files): Operation[] {
  const root = nodeOr(files.get(SPEC_FILE))
  return Object.entries(nodeOr(root.paths)).flatMap(([path, entry]) => {
    const item = deref(files, entry, SPEC_FILE)
    if (!isNode(item.node)) return missing(`path item for ${path}`)
    const stem = posix.basename(item.file, ".yaml")
    if (RESERVED_STEMS.includes(stem)) throw new Error(`openapi: ${item.file} would collide with the ${stem} page`)
    const node = item.node
    return METHODS.flatMap((method) => {
      const operation = node[method]
      return isNode(operation)
        ? [{ method, path, stem, file: item.file, node: operation, pathParameters: node.parameters }]
        : []
    })
  })
}

function groupsOf(operations: Operation[]): Map<string, Operation[]> {
  const groups = new Map<string, Operation[]>()
  for (const operation of operations) {
    groups.set(operation.stem, [...(groups.get(operation.stem) ?? []), operation])
  }
  return groups
}

function parametersOf(files: Files, operation: Operation): Located[] {
  const merged = new Map<string, Located>()
  for (const raw of [operation.pathParameters, operation.node.parameters]) {
    if (!Array.isArray(raw)) continue
    for (const entry of raw) {
      const located = deref(files, entry, operation.file)
      const parameter = nodeOr(located.node)
      merged.set(`${parameter.in}:${parameter.name}`, located)
    }
  }
  return [...merged.values()]
}

function parametersTable(files: Files, operation: Operation): string[] {
  const parameters = parametersOf(files, operation)
  if (parameters.length === 0) return []
  const rows = parameters.map(({ node, file }) => {
    const parameter = nodeOr(node)
    const scope = { files, file }
    return [
      cell(`${code(String(parameter.name))}${parameter.required === true ? " (required)" : ""}`),
      cell(String(parameter.in)),
      cell(labelOf(scope, parameter.schema)),
      cell([textOf(parameter, "description") ?? "", constraintNote(parameter.schema)].filter(Boolean).join(" ")),
    ]
  })
  return ["### Parameters", table(["Name", "In", "Type", "Description"], rows)]
}

function schemaBlock(scope: Scope, schema: unknown): string {
  const flat = flatten(schema)
  if (isNode(flat) && typeof flat.$ref === "string") return `A ${schemaLink(scope, flat.$ref)} object.`
  if (isNode(flat) && propertiesOf(flat) !== null) return fieldsTable(scope, flat)
  return `Type: ${labelOf(scope, flat)}.`
}

function requestBodyBlocks(files: Files, operation: Operation): string[] {
  if (operation.node.requestBody === undefined) return []
  const { node, file } = deref(files, operation.node.requestBody, operation.file)
  const body = nodeOr(node)
  const required = body.required === true ? ", required" : ""
  const scope = { files, file }
  return [
    "### Request body",
    ...Object.entries(nodeOr(body.content)).flatMap(([media, entry]) => [
      `${code(media)}${required}.`,
      schemaBlock(scope, nodeOr(entry).schema),
    ]),
  ]
}

function bodyLabel(scope: Scope, content: Node): string {
  return Object.entries(content)
    .map(([media, entry]) => (media === "application/json" ? labelOf(scope, nodeOr(entry).schema) : code(media)))
    .join(", ")
}

function responsesTable(files: Files, operation: Operation): string[] {
  const rows = Object.entries(nodeOr(operation.node.responses))
    .sort(([a], [b]) => compareStatus(a, b))
    .map(([status, raw]) => {
      const { node, file } = deref(files, raw, operation.file)
      const response = nodeOr(node)
      return [
        code(status),
        cell(textOf(response, "description") ?? ""),
        cell(bodyLabel({ files, file }, nodeOr(response.content))),
      ]
    })
  return ["### Responses", table(["Status", "Description", "Body"], rows)]
}

function operationBlocks(files: Files, operation: Operation): string[] {
  const { node } = operation
  const summary = textOf(node, "summary")
  const description = textOf(node, "description")
  return [
    `## ${operation.method.toUpperCase()} ${operation.path}`,
    ...(summary === undefined ? [] : [escapeText(summary)]),
    ...(description === undefined ? [] : [escapeText(description)]),
    ...(Array.isArray(node.security) && node.security.length === 0 ? ["No authentication."] : []),
    ...parametersTable(files, operation),
    ...requestBodyBlocks(files, operation),
    ...responsesTable(files, operation),
  ]
}

function schemaBlocks(files: Files, name: string, schema: unknown): string[] {
  const scope = { files, file: SPEC_FILE }
  const flat = nodeOr(flatten(schema))
  const description = textOf(flat, "description")
  const detail = Array.isArray(flat.enum)
    ? `One of ${flat.enum.map((value) => code(String(value))).join(", ")}.`
    : propertiesOf(flat) !== null
      ? fieldsTable(scope, flat)
      : `Type: ${labelOf(scope, flat)}.`
  return [`## ${name}`, ...(description === undefined ? [] : [escapeText(description)]), detail]
}

function responseStatuses(operations: Operation[]): Map<string, string[]> {
  const statuses = new Map<string, Set<string>>()
  for (const { node } of operations) {
    for (const [status, raw] of Object.entries(nodeOr(node.responses))) {
      const ref = isNode(raw) ? textOf(raw, "$ref") : undefined
      const name = ref === undefined ? undefined : RESPONSE_REF.exec(ref)?.[1]
      if (name !== undefined) statuses.set(name, (statuses.get(name) ?? new Set()).add(status))
    }
  }
  return new Map([...statuses].map(([name, set]) => [name, [...set].sort(compareStatus)]))
}

function authenticationBlocks(root: Node): string[] {
  const rows = Object.entries(nodeOr(nodeOr(root.components).securitySchemes)).map(([name, entry]) => {
    const scheme = nodeOr(entry)
    const how =
      scheme.type === "apiKey" && scheme.in === "cookie"
        ? `cookie ${scheme.name}`
        : scheme.type === "http" && scheme.scheme === "bearer"
          ? "Authorization: Bearer"
          : String(scheme.type)
    return [code(name), code(how), cell(textOf(scheme, "description") ?? "")]
  })
  return [
    "## Authentication",
    table(["Scheme", "How", "Description"], rows),
    "Every endpoint accepts either scheme unless its section says it needs no authentication.",
  ]
}

function errorsBlocks(root: Node, operations: Operation[]): string[] {
  const components = nodeOr(root.components)
  const schemas = nodeOr(components.schemas)
  const link = (name: string) => `[${code(name)}](${SCHEMAS_PAGE}#${name.toLowerCase()})`
  const clauses = [
    ...("Error" in schemas ? [`errors return an ${link("Error")} body`] : []),
    ...("ValidationError" in schemas ? [`validation errors return ${link("ValidationError")}`] : []),
  ]
  const sentence = clauses.join("; ")
  const statuses = responseStatuses(operations)
  const rows = Object.entries(nodeOr(components.responses)).map(([name, entry]) => [
    (statuses.get(name) ?? []).map(code).join(", "),
    cell(textOf(nodeOr(entry), "description") ?? ""),
  ])
  return [
    "## Errors",
    ...(sentence === "" ? [] : [`${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`]),
    table(["Status", "Meaning"], rows),
  ]
}

function endpointsBlocks(groups: Map<string, Operation[]>): string[] {
  return [
    "## Endpoints",
    ...[...groups].flatMap(([stem, operations]) => [
      `### ${groupTitle(stem)}`,
      table(
        ["Endpoint", "Summary"],
        operations.map((operation) => [
          `[${code(`${operation.method.toUpperCase()} ${operation.path}`)}](${API_BASE}${stem}/)`,
          cell(textOf(operation.node, "summary") ?? ""),
        ]),
      ),
    ]),
  ]
}

function footer(coreSha: string): string {
  const source = `${CORE_REPO_URL}/blob/${coreSha}/${SPEC_SOURCE}`
  return `Generated from [${code(SPEC_SOURCE)}](${source}) at ${code(coreSha)}. [Report a problem](${CORE_REPO_URL}/issues/new).`
}

function pageOf(path: string, meta: PageMeta, blocks: string[], coreSha: string): GeneratedPage {
  const head = frontMatter({ ...meta, generatedFrom: SPEC_SOURCE })
  return { path, markdown: `${head}${[...blocks, footer(coreSha)].join("\n\n")}\n` }
}

export function apiPages(files: ReadonlyMap<string, unknown>, coreSha: string): GeneratedPage[] {
  const root = nodeOr(files.get(SPEC_FILE))
  const servers = Array.isArray(root.servers) ? root.servers : []
  const serverUrl = textOf(nodeOr(servers[0]), "url") ?? missing("servers[0].url")
  const operations = operationsOf(files)
  const groups = groupsOf(operations)
  const schemas = Object.entries(nodeOr(nodeOr(root.components).schemas))

  const pages: GeneratedPage[] = [
    pageOf(
      "index.md",
      {
        title: "HTTP API",
        navLabel: "Overview",
        order: 0,
        description: "Base URL, authentication, errors and every endpoint of the SlashObserve HTTP API.",
      },
      [
        `Every path is relative to ${code(serverUrl)} on your SlashObserve server, and every request and response body is JSON unless an endpoint says otherwise.`,
        ...authenticationBlocks(root),
        ...errorsBlocks(root, operations),
        ...endpointsBlocks(groups),
      ],
      coreSha,
    ),
  ]

  for (const [index, [stem, members]] of [...groups].entries()) {
    const title = groupTitle(stem)
    pages.push(
      pageOf(
        `${stem}.md`,
        { title, description: `The ${title.toLowerCase()} endpoints of the HTTP API.`, order: 100 + index },
        members.flatMap((operation) => operationBlocks(files, operation)),
        coreSha,
      ),
    )
  }

  pages.push(
    pageOf(
      "schemas.md",
      { title: "Schemas", description: "The request and response objects the HTTP API endpoints use.", order: 900 },
      schemas.flatMap(([name, schema]) => {
        if (!SCHEMA_NAME.test(name)) throw new Error(`openapi: schema name ${name} must match ${SCHEMA_NAME}`)
        return schemaBlocks(files, name, schema)
      }),
      coreSha,
    ),
  )

  return pages
}
