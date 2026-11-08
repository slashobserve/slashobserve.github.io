export type SocialCard = { id: string; path: string; section: string; title: string }

export const SOCIAL_CARDS: readonly SocialCard[] = [
  { id: "home", path: "/", section: "Open source · self-hosted", title: "Observability workspace for humans and agents." },
  { id: "build", path: "/build/", section: "Build", title: "Ask for a dashboard. Get one that works." },
  { id: "migrate", path: "/migrate/", section: "Migrate", title: "Coming from Grafana, Kibana or OpenSearch Dashboards?" },
  { id: "signals", path: "/signals/", section: "Signals", title: "Three signals, six stores, one place to look." },
  { id: "docs", path: "/docs/", section: "Docs", title: "Start with the demo stack, then connect your own stores." },
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
