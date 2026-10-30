import type { CardColors } from "./colors"

type Props = { section: string; title: string; colors: CardColors }

const fill = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const

export function SocialCardImage({ section, title, colors }: Props) {
  const dots = `radial-gradient(circle, ${colors.gridline} 6%, transparent 9%)`
  return (
    <div
      style={{
        position: "relative",
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
        overflow: "hidden",
      }}
    >
      <div
        style={{
          ...fill,
          display: "flex",
          backgroundImage: `radial-gradient(55% 75% at 85% 0%, ${colors.halo}, transparent 70%)`,
        }}
      />
      <div
        style={{
          ...fill,
          display: "flex",
          backgroundImage: dots,
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(70% 90% at 85% 0%, black, transparent 80%)",        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em" }}>
          <span style={{ color: colors.fg }}>/</span>
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
            letterSpacing: "-0.035em",
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
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: "14px 20px",
          }}
        >
          /observe checkout health by pod, last 6h
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: colors.mfg }}>slashobserve.com</div>
    </div>
  )
}
