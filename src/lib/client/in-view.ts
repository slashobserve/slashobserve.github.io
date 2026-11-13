import {
  IN_VIEW_ATTRIBUTE,
  MOTION_CLASS,
  SEEN_ATTRIBUTE,
  firstEntered,
  motionAllowed,
} from "../motion"

const ENTER_MARGIN = "0px 0px -12% 0px"

let observer: IntersectionObserver | undefined
const seen = new Set<Element>()

function observe(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const element of firstEntered(entries, seen)) {
        element.setAttribute(SEEN_ATTRIBUTE, "")
        observer?.unobserve(element)
      }
    },
    { rootMargin: ENTER_MARGIN },
  )
  return observer
}

export function watchInView(root: ParentNode = document): void {
  const allowed = motionAllowed({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    hasObserver: "IntersectionObserver" in window,
  })
  if (!allowed) return
  document.documentElement.classList.add(MOTION_CLASS)
  const watcher = observe()
  root.querySelectorAll(`[${IN_VIEW_ATTRIBUTE}]`).forEach((element) => {
    if (!seen.has(element)) watcher.observe(element)
  })
}
