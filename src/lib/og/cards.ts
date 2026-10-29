export type SocialCard = { id: string; path: string; section: string; title: string }

export const SOCIAL_CARDS: readonly SocialCard[] = [
  { id: "home", path: "/", section: "Open source · self-hosted", title: "Ask for a dashboard. Get one that works." },
  { id: "grafana", path: "/grafana/", section: "Coming from Grafana", title: "Keep your Grafana dashboards. Change how you build them." },
  { id: "features", path: "/features/", section: "Features", title: "Everything you need to run dashboards with an agent." },
]

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

export function cardFor(pathname: string): SocialCard | null {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`
  return SOCIAL_CARDS.find((card) => card.path === path) ?? null
}

export function cardImagePath(card: SocialCard): string {
  return `/og/${card.id}.png`
}
