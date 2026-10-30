export type GeneratedPage = { path: string; markdown: string }

export type FrontMatter = {
  title: string
  description: string
  navLabel?: string
  order: number
  generatedFrom: string
}

const CODE_SPAN = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g
const SENTENCE_END = /(?<=[.!?])\s+/
const MILESTONE = /milestone/i

type Node = Record<string, unknown>

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function frontMatter(fields: FrontMatter): string {
  const lines = [
    `title: ${JSON.stringify(fields.title)}`,
    `description: ${JSON.stringify(fields.description)}`,
    ...(fields.navLabel === undefined ? [] : [`navLabel: ${JSON.stringify(fields.navLabel)}`]),
    `order: ${fields.order}`,
    `generatedFrom: ${JSON.stringify(fields.generatedFrom)}`,
  ]
  return ["---", ...lines, "---", "", ""].join("\n")
}

export function escapeText(text: string): string {
  const escape = (segment: string) => segment.replaceAll("<", "&lt;")
  let out = ""
  let last = 0
  for (const span of text.matchAll(CODE_SPAN)) {
    out += escape(text.slice(last, span.index)) + span[0]
    last = span.index + span[0].length
  }
  return out + escape(text.slice(last))
}

export function cell(text: string): string {
  return escapeText(text).replace(/\s*[\r\n]+\s*/g, " ").replaceAll("|", "\\|").trim()
}

export function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (values: readonly string[]) =>
    `| ${values.map((value) => (value === "" ? " " : value)).join(" | ")} |`
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n")
}

export function code(text: string): string {
  return text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``
}

export function withoutMilestones(text: string): string {
  return text
    .split(SENTENCE_END)
    .filter((sentence) => !MILESTONE.test(sentence))
    .join(" ")
}

export function assertSiteSafe(page: GeneratedPage): void {
  if (/\bmilestone/i.test(page.markdown)) {
    throw new Error(`${page.path}: generated text mentions a milestone`)
  }
}

function branchLabels(node: Node, refLabel: (ref: string) => string): string {
  const branches = node.oneOf ?? node.anyOf
  return Array.isArray(branches)
    ? branches.map((branch) => typeLabel(branch, refLabel)).join(" or ")
    : ""
}

function plainLabel(node: Node, refLabel: (ref: string) => string): string {
  if (typeof node.$ref === "string") return refLabel(node.$ref)
  if ("const" in node) return code(JSON.stringify(node.const))
  if (Array.isArray(node.enum)) return node.enum.map((value) => code(JSON.stringify(value))).join(", ")
  const branches = branchLabels(node, refLabel)
  if (branches !== "") return branches
  if (Array.isArray(node.type)) return node.type.map((name) => code(String(name))).join(" or ")
  if (node.type === "array") return `array of ${typeLabel(node.items, refLabel)}`
  if (node.type === "object") return code("object")
  if (typeof node.type === "string") {
    const format = typeof node.format === "string" ? ` (${node.format})` : ""
    return `${code(node.type)}${format}`
  }
  return "any"
}

export function typeLabel(node: unknown, refLabel: (ref: string) => string): string {
  if (!isNode(node)) return "any"
  const label = plainLabel(node, refLabel)
  return node.nullable === true ? `${label} or ${code("null")}` : label
}

export function constraintNote(node: unknown): string {
  if (!isNode(node)) return ""
  const notes: string[] = []
  if (typeof node.minimum === "number" && typeof node.maximum === "number") {
    notes.push(`Between ${node.minimum} and ${node.maximum}.`)
  }
  if (node.type === "array" && typeof node.maxItems === "number") {
    notes.push(`At most ${node.maxItems} items.`)
  }
  if ("default" in node) notes.push(`Default ${code(JSON.stringify(node.default))}.`)
  return notes.join(" ")
}
