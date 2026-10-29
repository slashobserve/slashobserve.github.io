export type PageScan = { links: string[]; ids: Set<string> }

const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'=<>`/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g
const ATTRIBUTE = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const LINK_ATTRIBUTE: Record<string, string> = {
  a: "href",
  link: "href",
  script: "src",
  img: "src",
  source: "src",
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&amp;", "&")
}

function withoutInertContent(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2\s*>/gi, "$1")
}

function attributesOf(raw: string): Map<string, string> {
  const attributes = new Map<string, string>()
  for (const match of raw.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ""
    if (!attributes.has(name)) attributes.set(name, decodeEntities(value))
  }
  return attributes
}

export function scanHtml(html: string): PageScan {
  const links: string[] = []
  const ids = new Set<string>()
  for (const tag of withoutInertContent(html).matchAll(TAG)) {
    const name = tag[1].toLowerCase()
    const attributes = attributesOf(tag[2])
    const id = attributes.get("id")
    if (id) ids.add(id)
    const anchorName = name === "a" ? attributes.get("name") : undefined
    if (anchorName) ids.add(anchorName)
    const linkAttribute = LINK_ATTRIBUTE[name]
    const target = linkAttribute ? attributes.get(linkAttribute) : undefined
    if (target !== undefined) links.push(target)
  }
  return { links, ids }
}
