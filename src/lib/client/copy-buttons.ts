import { mount } from "./mount"

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>`
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/></svg>`
const RESET_DELAY_MS = 1500

function initCodeCopy(pre: HTMLElement): () => void {
  const host = pre.closest<HTMLElement>(".nb-code-figure") ?? pre
  const button = document.createElement("button")
  button.type = "button"
  button.className = "nb-code-copy"
  button.setAttribute("aria-label", "Copy code to clipboard")
  button.innerHTML = COPY_ICON
  let resetTimer: number | undefined

  async function handleClick() {
    const text = pre.querySelector("code")?.textContent ?? pre.textContent ?? ""
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    button.innerHTML = CHECK_ICON
    button.dataset.state = "copied"
    button.setAttribute("aria-label", "Copied!")
    if (resetTimer) window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      button.innerHTML = COPY_ICON
      delete button.dataset.state
      button.setAttribute("aria-label", "Copy code to clipboard")
    }, RESET_DELAY_MS)
  }

  button.addEventListener("click", handleClick)
  host.style.position = "relative"
  host.appendChild(button)

  return () => {
    if (resetTimer) window.clearTimeout(resetTimer)
    button.removeEventListener("click", handleClick)
    button.remove()
  }
}

export function codeCopy(): void {
  mount("pre.astro-code", initCodeCopy)
}
