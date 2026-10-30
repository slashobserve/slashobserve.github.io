import { startsHidden } from "../reveal"

const MOTION_OK = "(prefers-reduced-motion: no-preference)"

export function reveal(root: ParentNode = document): void {
  if (!matchMedia(MOTION_OK).matches || !("IntersectionObserver" in window)) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add("revealed")
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: "0px 0px -10% 0px" },
  )
  for (const element of root.querySelectorAll<HTMLElement>("[data-reveal]")) {
    if (!startsHidden(element.getBoundingClientRect().top, innerHeight)) continue
    element.classList.add("reveal-armed")
    observer.observe(element)
  }
}
