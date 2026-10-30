export function mount(selector: string, init: (el: HTMLElement) => () => void): void {
  const instances = new Map<Element, () => void>()

  function setup() {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      if (instances.has(el)) return
      instances.set(el, init(el))
    })
  }

  function teardown() {
    instances.forEach((destroy) => destroy())
    instances.clear()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true })
  } else {
    setup()
  }
  document.addEventListener("astro:before-swap", teardown)
  document.addEventListener("astro:page-load", setup)
}
