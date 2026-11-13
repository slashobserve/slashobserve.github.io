import type { CardColors } from "./colors"

type Props = { section: string; title: string; colors: CardColors }

export function SocialCardImage({ section, title, colors }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "72px 80px",
        backgroundColor: colors.bg,
        color: colors.fg,
        fontFamily: "Geist",
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em" }}>
          <span style={{ color: colors.brand }}>/</span>
          <span>observe</span>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Geist Mono",
            fontSize: 18,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: colors.brand,
          }}
        >
          {section}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
            maxWidth: 960,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            fontFamily: "Geist Mono",
            fontSize: 24,
            color: colors.mfg,
            backgroundColor: colors.canvas,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "14px 20px",
          }}
        >
          checkout health by pod, last 6h
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: colors.mfg }}>slashobserve.com</div>
    </div>
  )
}
