import { mount } from "./mount"

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>`
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/></svg>`
const RESET_DELAY_MS = 1500

const clipboardAvailable = () => Boolean(navigator.clipboard)

function wireCopy(button: HTMLElement, idleLabel: string, getText: () => string): () => void {
  let resetTimer: number | undefined

  const show = (icon: string, label: string) => {
    button.innerHTML = `${icon}<span>${label}</span>`
  }

  async function handleClick() {
    const text = getText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    show(CHECK_ICON, "Copied")
    button.dataset.state = "copied"
    if (resetTimer) window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      show(COPY_ICON, idleLabel)
      delete button.dataset.state
    }, RESET_DELAY_MS)
  }

  show(COPY_ICON, idleLabel)
  button.addEventListener("click", handleClick)

  return () => {
    if (resetTimer) window.clearTimeout(resetTimer)
    button.removeEventListener("click", handleClick)
  }
}

function initCodeCopy(pre: HTMLElement): () => void {
  if (!clipboardAvailable()) return () => {}
  const host = pre.closest<HTMLElement>(".nb-code-figure") ?? pre
  const button = document.createElement("button")
  button.type = "button"
  button.className = "nb-code-copy"
  button.setAttribute("aria-live", "polite")
  const unwire = wireCopy(button, "Copy", () => pre.querySelector("code")?.textContent ?? pre.textContent ?? "")
  host.style.position = "relative"
  host.appendChild(button)

  return () => {
    unwire()
    button.remove()
  }
}

function initMarkdownCopy(button: HTMLElement): () => void {
  if (!clipboardAvailable()) return () => {}
  const unwire = wireCopy(button, "Copy as Markdown", () => button.dataset.markdown ?? "")
  button.hidden = false
  return () => {
    unwire()
    button.hidden = true
  }
}

export function copyButtons(): void {
  mount("pre.astro-code", initCodeCopy)
  mount("[data-copy-markdown]", initMarkdownCopy)
}
