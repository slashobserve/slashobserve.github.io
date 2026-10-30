let liveRegion: HTMLElement | null = null

function announce(message: string): void {
  if (!liveRegion || !liveRegion.isConnected) {
    liveRegion = document.createElement("div")
    liveRegion.setAttribute("aria-live", "polite")
    Object.assign(liveRegion.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
    })
    document.body.appendChild(liveRegion)
  }
  liveRegion.textContent = ""
  liveRegion.textContent = message
}

function applyHeadingAnchors(): void {
  document
    .querySelectorAll<HTMLElement>(".docs-content :is(h2, h3, h4)[id]")
    .forEach((heading) => {
      if (heading.hasAttribute("data-heading-anchor-ready")) return
      heading.setAttribute("data-heading-anchor-ready", "true")
      const link = document.createElement("a")
      link.href = `#${heading.id}`
      link.className = "heading-anchor"
      link.setAttribute("aria-label", `Copy link to ${heading.textContent?.trim() ?? "section"}`)
      link.textContent = "#"
      link.addEventListener("click", () => {
        const url = new URL(link.getAttribute("href") ?? `#${heading.id}`, location.href).href
        navigator.clipboard
          ?.writeText(url)
          .then(() => announce("Link copied to clipboard"), () => {})
      })
      heading.appendChild(link)
    })
}

export function headingAnchors(): void {
  applyHeadingAnchors()
  document.addEventListener("astro:page-load", applyHeadingAnchors)
}
