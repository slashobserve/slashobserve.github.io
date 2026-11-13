export const IN_VIEW_ATTRIBUTE = "data-in-view"
export const SEEN_ATTRIBUTE = "data-seen"
export const MOTION_CLASS = "motion"

export interface MotionEnvironment {
  reducedMotion: boolean
  hasObserver: boolean
}

export function motionAllowed({ reducedMotion, hasObserver }: MotionEnvironment): boolean {
  return hasObserver && !reducedMotion
}

export interface ViewEntry<T> {
  target: T
  isIntersecting: boolean
}

export function firstEntered<T>(entries: readonly ViewEntry<T>[], seen: Set<T>): T[] {
  const entered: T[] = []
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting || seen.has(target)) continue
    seen.add(target)
    entered.push(target)
  }
  return entered
}
