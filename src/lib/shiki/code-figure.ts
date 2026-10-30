import type { ShikiConfig } from "astro"

const PLAIN_TEXT = new Set(["", "text", "plaintext", "plain", "txt"])

export const codeFigure: NonNullable<ShikiConfig["transformers"]>[number] = {
  name: "code-figure",
  pre(preNode) {
    const lang = PLAIN_TEXT.has(this.options.lang ?? "") ? "text" : this.options.lang
    preNode.properties = preNode.properties ?? {}
    this.addClassToHast(preNode, "astro-code")
    preNode.properties["data-nb-lang"] = lang
    return {
      type: "element",
      tagName: "figure",
      properties: { class: "nb-code-figure", "data-nb-lang": lang },
      children: [preNode],
    }
  },
}
