import type { ShikiConfig } from "astro"

export const codeFigure: NonNullable<ShikiConfig["transformers"]>[number] = {
  name: "code-figure",
  pre(preNode) {
    const lang = this.options.lang || "text"
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
