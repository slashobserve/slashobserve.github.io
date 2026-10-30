const ATTR = "data-scroll-locked"

let lockCount = 0
let savedPaddingRight = ""

export function lockScroll(): void {
  lockCount++
  if (lockCount > 1) return
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  savedPaddingRight = document.body.style.paddingRight
  document.body.setAttribute(ATTR, "")
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
}

export function unlockScroll(): void {
  if (lockCount === 0) return
  lockCount--
  if (lockCount > 0) return
  document.body.removeAttribute(ATTR)
  document.body.style.paddingRight = savedPaddingRight
}
