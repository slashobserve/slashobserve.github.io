import type { HastPluginDefinition } from "satteri"

function hasClass(className: unknown): boolean {
  if (Array.isArray(className)) return className.length > 0
  if (typeof className === "string") return className.split(/\s+/).some(Boolean)
  return false
}

export const tableScroll: HastPluginDefinition = {
  name: "table-scroll",
  element: {
    filter: ["table"],
    visit(node) {
      if (hasClass(node.properties?.className)) return
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["nb-table-scroll"] },
        children: [
          {
            type: "element",
            tagName: "table",
            properties: { ...node.properties },
            children: node.children ?? [],
          },
        ],
      }
    },
  },
}
