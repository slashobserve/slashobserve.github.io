import { CORE_EDIT_BRANCH, CORE_REPO_URL, SCHEMA_SOURCE, SPEC_EXAMPLES_SOURCE } from "../sync/paths"
import {
  cell,
  code,
  constraintNote,
  escapeText,
  frontMatter,
  table,
  typeLabel,
  withoutMilestones,
  type GeneratedPage,
} from "./markdown"

export type Example = { file: string; spec: unknown }

export const OBSERVESPEC_BASE = "/docs/reference/observespec/"

type Node = Record<string, unknown>
type Branch = { name: string; def: Node }
type PageMeta = { title: string; description: string; navLabel?: string; order: number }

const DEF_PREFIX = "#/$defs/"
const FIELD_OPTIONS = `${OBSERVESPEC_BASE}field-options/`
const DATA_PANEL_REF = `${DEF_PREFIX}dataPanel`

const REF_PAGES = new Map([
  ["fieldProps", FIELD_OPTIONS],
  ["override", `${OBSERVESPEC_BASE}overrides-and-mappings/#overrides`],
  ["mapping", `${OBSERVESPEC_BASE}overrides-and-mappings/#mappings`],
  ["transform", `${OBSERVESPEC_BASE}transforms/`],
])

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function missing(path: string): never {
  throw new Error(`observespec schema: missing ${path}`)
}

function valueAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (isNode(value) ? value[key] : undefined), root)
}

function nodeAt(root: unknown, path: string): Node {
  const value = valueAt(root, path)
  return isNode(value) ? value : missing(path)
}

function listAt(root: unknown, path: string): unknown[] {
  const value = valueAt(root, path)
  return Array.isArray(value) ? value : missing(path)
}

function textOf(node: Node, key: string): string | undefined {
  const value = node[key]
  return typeof value === "string" ? value : undefined
}

function namesOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((name): name is string => typeof name === "string") : []
}

function refLabel(ref: string): string {
  const name = ref.startsWith(DEF_PREFIX) ? ref.slice(DEF_PREFIX.length) : ref
  const target = REF_PAGES.get(name)
  return target === undefined ? code(name) : `[${code(name)}](${target})`
}

function resolveBranch(defs: Node, branch: unknown, path: string): Node {
  const ref = isNode(branch) ? textOf(branch, "$ref") : undefined
  const def = ref === undefined ? branch : defs[ref.slice(DEF_PREFIX.length)]
  return isNode(def) ? def : missing(path)
}

function resolveBranches(root: Node, defs: Node, path: string): Node[] {
  return listAt(root, path).map((branch, index) => resolveBranch(defs, branch, `${path}[${index}]`))
}

function constBranches(root: Node, defs: Node, path: string, skip: (branch: unknown) => boolean = () => false): Branch[] {
  return listAt(root, path).flatMap((branch, index) => {
    if (skip(branch)) return []
    const at = `${path}[${index}]`
    const def = resolveBranch(defs, branch, at)
    const name = valueAt(def, "properties.type.const")
    return typeof name === "string" ? [{ name, def }] : missing(`${at}.properties.type.const`)
  })
}

function describe(node: unknown, defs: Node): string {
  if (!isNode(node)) return ""
  const ref = textOf(node, "$ref")
  const referenced = ref === undefined ? undefined : defs[ref.slice(DEF_PREFIX.length)]
  const own = textOf(node, "description") ?? (isNode(referenced) ? textOf(referenced, "description") : undefined)
  return [own ?? "", constraintNote(node)].filter((part) => part !== "").join(" ")
}

function fieldsTable(properties: Node, required: unknown, defs: Node, omit: readonly string[] = []): string {
  const requiredNames = namesOf(required)
  const rows = Object.entries(properties)
    .filter(([name]) => !omit.includes(name))
    .map(([name, node]) => [
      cell(`${code(name)}${requiredNames.includes(name) ? " (required)" : ""}`),
      cell(typeLabel(node, refLabel)),
      cell(describe(node, defs)),
    ])
  return table(["Field", "Type", "Description"], rows)
}

function displayValues(node: unknown): string {
  return isNode(node) && node.type === "boolean" ? `${code("true")}, ${code("false")}` : typeLabel(node, refLabel)
}

function displayTable(properties: Node, defs: Node): string {
  const rows = Object.entries(properties).map(([name, node]) => [
    cell(code(name)),
    cell(displayValues(node)),
    cell(describe(node, defs)),
  ])
  return table(["Field", "Values", "Description"], rows)
}

function displayPropertiesOf(node: unknown): Node | null {
  const properties = valueAt(node, "properties.display.properties")
  return isNode(properties) && Object.keys(properties).length > 0 ? properties : null
}

function displayByType(allOf: unknown[]): Map<string, Node | null> {
  const found = new Map<string, Node | null>()
  for (const rule of allOf) {
    const type = valueAt(rule, "if.properties.type.const")
    if (typeof type === "string") found.set(type, displayPropertiesOf(valueAt(rule, "then")))
  }
  return found
}

function byFile(examples: readonly Example[]): Example[] {
  return [...examples].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
}

function findPanel(panels: unknown, type: string): unknown {
  if (!Array.isArray(panels)) return undefined
  for (const panel of panels) {
    if (!isNode(panel)) continue
    if (panel.type === type) return panel
    const child = findPanel(panel.panels, type)
    if (child !== undefined) return child
  }
  return undefined
}

function findVariable(variables: unknown, type: string): unknown {
  return Array.isArray(variables) ? variables.find((variable) => isNode(variable) && variable.type === type) : undefined
}

function exampleBlocks(
  examples: readonly Example[],
  kind: "panels" | "variables",
  type: string,
): string[] {
  for (const { file, spec } of byFile(examples)) {
    const list = isNode(spec) ? spec[kind] : undefined
    const value = kind === "panels" ? findPanel(list, type) : findVariable(list, type)
    if (value === undefined) continue
    return [
      "## Example",
      ["```json", JSON.stringify(value, null, 2), "```"].join("\n"),
      `From [${code(`${SPEC_EXAMPLES_SOURCE}/${file}`)}](${CORE_REPO_URL}/blob/${CORE_EDIT_BRANCH}/${SPEC_EXAMPLES_SOURCE}/${file}).`,
    ]
  }
  return []
}

function footer(coreSha: string): string {
  const source = `${CORE_REPO_URL}/blob/${coreSha}/${SCHEMA_SOURCE}`
  return `Generated from [${code(SCHEMA_SOURCE)}](${source}) at ${code(coreSha)}. [Report a problem](${CORE_REPO_URL}/issues/new).`
}

function pageOf(path: string, meta: PageMeta, blocks: string[], coreSha: string): GeneratedPage {
  const head = frontMatter({ ...meta, generatedFrom: SCHEMA_SOURCE })
  return { path, markdown: `${head}${[...blocks, footer(coreSha)].join("\n\n")}\n` }
}

function pageList(base: string, names: readonly string[]): string {
  return names.map((name) => `- [${code(name)}](${OBSERVESPEC_BASE}${base}/${name.toLowerCase()}/)`).join("\n")
}

export function observespecPages(
  schema: unknown,
  examples: readonly Example[],
  coreSha: string,
): GeneratedPage[] {
  const root = isNode(schema) ? schema : missing("$")
  const defs = nodeAt(root, "$defs")
  const topProperties = nodeAt(root, "properties")
  const dataPanel = nodeAt(root, "$defs.dataPanel")
  const dataProperties = nodeAt(root, "$defs.dataPanel.properties")
  const dataTypes = listAt(root, "$defs.dataPanel.properties.type.enum").map(String)
  const dataDisplay = displayByType(listAt(root, "$defs.dataPanel.allOf"))
  const otherPanels = constBranches(
    root,
    defs,
    "$defs.panel.oneOf",
    (branch) => isNode(branch) && branch.$ref === DATA_PANEL_REF,
  )
  const variables = constBranches(root, defs, "$defs.variable.oneOf")
  const fieldProperties = nodeAt(root, "$defs.fieldProps.properties")
  const override = nodeAt(root, "$defs.override")
  const mappingDef = nodeAt(root, "$defs.mapping")
  const mappings = resolveBranches(root, defs, "$defs.mapping.oneOf")
  const transforms = constBranches(root, defs, "$defs.transform.oneOf")

  const fieldOptionsLine = `Every data panel also takes the [field options](${FIELD_OPTIONS}).`
  const pages: GeneratedPage[] = []

  pages.push(
    pageOf(
      "index.md",
      {
        title: "ObserveSpec schema",
        navLabel: "Overview",
        order: 0,
        description: withoutMilestones(textOf(root, "description") ?? ""),
      },
      [
        "## Fields",
        fieldsTable(topProperties, root.required, defs),
        "## Variable types",
        pageList("variables", variables.map((variable) => variable.name)),
        "## Panel types",
        pageList("panels", [...dataTypes, ...otherPanels.map((panel) => panel.name)]),
        `The JSON Schema is published at [${code("/schemas/observespec.v0.json")}](/schemas/observespec.v0.json).`,
      ],
      coreSha,
    ),
  )

  variables.forEach(({ name, def }, index) => {
    pages.push(
      pageOf(
        `variables/${name.toLowerCase()}.md`,
        { title: name, description: `Fields of a ${code(name)} variable.`, order: 100 + index },
        [
          ...exampleBlocks(examples, "variables", name),
          "## Fields",
          fieldsTable(nodeAt(def, "properties"), def.required, defs),
        ],
        coreSha,
      ),
    )
  })

  dataTypes.forEach((type, index) => {
    const display = dataDisplay.get(type) ?? null
    pages.push(
      pageOf(
        `panels/${type.toLowerCase()}.md`,
        {
          title: type,
          description: `${display === null ? "Fields" : "Fields and display options"} of a ${code(type)} panel.`,
          order: 200 + index,
        },
        [
          ...exampleBlocks(examples, "panels", type),
          "## Fields",
          fieldsTable(dataProperties, dataPanel.required, defs, ["display"]),
          fieldOptionsLine,
          ...(display === null ? [] : ["## Display options", displayTable(display, defs)]),
        ],
        coreSha,
      ),
    )
  })

  otherPanels.forEach(({ name, def }, index) => {
    const display = displayPropertiesOf(def)
    pages.push(
      pageOf(
        `panels/${name.toLowerCase()}.md`,
        {
          title: name,
          description: textOf(def, "description") ?? `Fields of a ${code(name)} panel.`,
          order: 221 + index,
        },
        [
          ...exampleBlocks(examples, "panels", name),
          "## Fields",
          fieldsTable(nodeAt(def, "properties"), def.required, defs, display === null ? [] : ["display"]),
          ...(display === null ? [] : ["## Display options", displayTable(display, defs)]),
        ],
        coreSha,
      ),
    )
  })

  pages.push(
    pageOf(
      "field-options.md",
      {
        title: "Field options",
        description:
          "Options every data panel and every override accepts, such as unit, decimals, thresholds and mappings.",
        order: 300,
      },
      ["## Fields", fieldsTable(fieldProperties, undefined, defs)],
      coreSha,
    ),
  )

  const mappingIntro = textOf(mappingDef, "description")
  pages.push(
    pageOf(
      "overrides-and-mappings.md",
      {
        title: "Overrides and mappings",
        description: "Change field options for matching series, and map raw values to text and colours.",
        order: 310,
      },
      [
        "## Overrides",
        fieldsTable(nodeAt(override, "properties"), override.required, defs),
        `Every [field option](${FIELD_OPTIONS}) can also be set on an override.`,
        "## Mappings",
        ...(mappingIntro === undefined ? [] : [escapeText(mappingIntro)]),
        ...mappings.flatMap((branch, index) => {
          const properties = nodeAt(branch, "properties")
          const key = Object.keys(properties)[0] ?? missing(`$defs.mapping.oneOf[${index}].properties`)
          return [`### ${key}`, fieldsTable(properties, branch.required, defs)]
        }),
      ],
      coreSha,
    ),
  )

  pages.push(
    pageOf(
      "transforms.md",
      {
        title: "Transforms",
        description: "Transforms that reshape query results in the browser before a panel draws them.",
        order: 320,
      },
      transforms.flatMap(({ name, def }) => {
        const properties = nodeAt(def, "properties")
        const body =
          Object.keys(properties).length > 1
            ? fieldsTable(properties, def.required, defs)
            : `No options besides ${code("type")}.`
        return [`## ${name}`, body]
      }),
      coreSha,
    ),
  )

  return pages
}
