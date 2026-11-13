import { describe, expect, test } from "bun:test"
import { firstEntered, motionAllowed } from "./motion"

describe("motionAllowed", () => {
  test.each([
    [{ reducedMotion: false, hasObserver: true }, true],
    [{ reducedMotion: true, hasObserver: true }, false],
    [{ reducedMotion: false, hasObserver: false }, false],
    [{ reducedMotion: true, hasObserver: false }, false],
  ])("%o gives %p", (environment, expected) => {
    expect(motionAllowed(environment)).toBe(expected)
  })
})

describe("firstEntered", () => {
  test("returns the targets that are intersecting and marks them seen", () => {
    const seen = new Set<string>()
    const entered = firstEntered(
      [
        { target: "a", isIntersecting: true },
        { target: "b", isIntersecting: false },
        { target: "c", isIntersecting: true },
      ],
      seen,
    )
    expect(entered).toEqual(["a", "c"])
    expect([...seen]).toEqual(["a", "c"])
  })

  test("never returns a target twice, across calls or within one", () => {
    const seen = new Set<string>()
    firstEntered([{ target: "a", isIntersecting: true }], seen)
    const again = firstEntered(
      [
        { target: "a", isIntersecting: true },
        { target: "b", isIntersecting: true },
        { target: "b", isIntersecting: true },
      ],
      seen,
    )
    expect(again).toEqual(["b"])
  })

  test("returns nothing for an empty batch", () => {
    expect(firstEntered([], new Set<string>())).toEqual([])
  })
})
