import { useEffect, useRef, useState, type CSSProperties } from "react"
import { LAST_STEP, STEPS, STEP_MS, nextStep, sceneAt, type Step } from "./agent-loop-state"

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 0.85fr) 64px minmax(0, 1.25fr)",
  alignItems: "stretch",
}

const figureStyle: CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minWidth: 0,
}

const captionStyle: CSSProperties = { fontWeight: 500 }

const windowHeight = 420

const terminalBarStyle: CSSProperties = {
  borderBottom: "1px solid var(--ink-border)",
  color: "var(--term-dim)",
}

const terminalBodyStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: 7,
  padding: 16,
  fontSize: 12,
  lineHeight: 1.55,
}

const terminalGroupStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 7 }

const followUpGroupStyle: CSSProperties = {
  ...terminalGroupStyle,
  paddingTop: 6,
  borderTop: "1px dashed var(--ink-border)",
}

const promptMarkStyle: CSSProperties = { color: "var(--term-accent)", marginRight: 8 }

const browserBarStyle: CSSProperties = {
  borderBottom: "1px solid var(--border)",
  color: "var(--mfg)",
}

const addressStyle: CSSProperties = {
  background: "var(--muted-bg)",
  borderRadius: 6,
  padding: "3px 12px",
  fontSize: 10.5,
}

const breadcrumbStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderBottom: "1px solid var(--border)",
  fontSize: 12,
}

const panelGridStyle: CSSProperties = {
  flex: 1,
  padding: 12,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gridAutoRows: "minmax(0, 1fr)",
  gap: 10,
  minHeight: 0,
}

const placeholderStyle: CSSProperties = {
  border: "1px dashed var(--border-strong)",
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  color: "var(--mfg)",
  fontSize: 12,
}

const panelStyle: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minHeight: 0,
}

const panelTitleStyle: CSSProperties = { fontSize: 11.5, fontWeight: 500 }

const chartStyle: CSSProperties = { width: "100%", flex: 1, minHeight: 0, display: "block" }

const logRowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8 }

const logMessageStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const stepRowStyle: CSSProperties = {
  display: "flex",
  gap: 28,
  flexWrap: "wrap",
  marginTop: 18,
  justifyContent: "center",
}

const placeholderLabels = ["Requests per second", "p99 latency", "Error rate", "Error logs"]

function TrafficLights() {
  return (
    <div className="lights">
      <span style={{ background: "var(--light-close)" }} />
      <span style={{ background: "var(--light-min)" }} />
      <span style={{ background: "var(--light-max)" }} />
    </div>
  )
}

function Series({ points, color }: { points: string; color: string }) {
  return (
    <polyline
      points={points}
      fill="none"
      style={{ stroke: color }}
      strokeWidth={1.6}
      vectorEffect="non-scaling-stroke"
    />
  )
}

export default function AgentLoop() {
  const [step, setStep] = useState<Step>(LAST_STEP)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inView, setInView] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => {
      setReducedMotion(query.matches)
      if (query.matches) setStep(LAST_STEP)
    }
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const apply = () => setDocumentVisible(document.visibilityState === "visible")
    apply()
    document.addEventListener("visibilitychange", apply)
    return () => document.removeEventListener("visibilitychange", apply)
  }, [])

  const playing = inView && documentVisible && !paused && !reducedMotion

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setStep(nextStep), STEP_MS)
    return () => clearTimeout(timer)
  }, [step, playing])

  const scene = sceneAt(step)

  return (
    <div ref={rootRef}>
      <div className="g1-sm" style={gridStyle} onClick={() => setPaused(true)}>
        <figure style={figureStyle}>
          <figcaption className="hint" style={captionStyle}>
            You, in a terminal, chat or editor
          </figcaption>
          <div className="win term" style={{ height: windowHeight }}>
            <div className="bar" style={terminalBarStyle}>
              <TrafficLights />
              <span style={{ flex: 1, textAlign: "center" }}>zsh</span>
              <span style={{ width: 42 }} />
            </div>
            <div className="mono" style={terminalBodyStyle}>
              <div style={{ color: "var(--term-strong)" }}>
                <span style={promptMarkStyle}>$</span>observe "checkout health by pod, last 6h"
              </div>
              <div>Found datasources prom, ch</div>
              <div>Wrote 4 panels</div>
              {scene.firstRun && (
                <div style={terminalGroupStyle}>
                  <div>Ran 4 queries</div>
                  <div style={{ color: "var(--term-warn)" }}>
                    Repaired p99 latency: added le to by()
                  </div>
                  <div style={{ color: "var(--term-ok)" }}>✓ Saved version 1</div>
                </div>
              )}
              {scene.followUp && (
                <div style={followUpGroupStyle}>
                  <div style={{ color: "var(--term-strong)" }}>
                    <span style={promptMarkStyle}>●</span>Priya: "add error rate by route"
                  </div>
                  <div>Ran 5 queries</div>
                  <div style={{ color: "var(--term-ok)" }}>✓ Saved version 2</div>
                </div>
              )}
            </div>
          </div>
        </figure>

        <div
          aria-hidden="true"
          className="hide-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 30,
          }}
        >
          <svg width="44" height="14" viewBox="0 0 44 14" fill="none">
            <path
              d="M0 7h40M34 1l6 6-6 6"
              style={{ stroke: "var(--border-strong)" }}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <figure style={figureStyle}>
          <figcaption className="hint" style={captionStyle}>
            Your team, in the browser
          </figcaption>
          <div className="win" style={{ height: windowHeight, background: "var(--surface)" }}>
            <div className="bar" style={browserBarStyle}>
              <TrafficLights />
              <span style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <span className="mono" style={addressStyle}>
                  observe.example.com/dashboards/checkout
                </span>
              </span>
              <span style={{ width: 42 }} />
            </div>
            <div style={breadcrumbStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
                <rect width="24" height="24" rx="5.8" style={{ fill: "var(--fg)" }} />
                <path
                  d="M14.6 5.6 9.4 18.4"
                  style={{ stroke: "var(--bg)" }}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
              </svg>
              <span style={{ color: "var(--mfg)" }}>Dashboards /</span>
              <span style={{ fontWeight: 500 }}>Checkout service health</span>
              <span className="chip" style={{ fontSize: 11, padding: "1px 8px" }}>
                <span className="dot" style={{ background: "var(--ok)" }} />
                Live · {scene.versionLabel}
              </span>
              <span className="hint hide-sm" style={{ marginLeft: "auto", fontSize: 11 }}>
                Last 6 hours
              </span>
            </div>
            <div style={panelGridStyle}>
              {scene.placeholders &&
                placeholderLabels.map((label) => (
                  <div key={label} style={placeholderStyle}>
                    {label}
                  </div>
                ))}
              {scene.firstRun && (
                <>
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>Requests per second by pod</div>
                    <svg
                      viewBox="0 0 300 90"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Requests per second for three pods"
                      style={chartStyle}
                    >
                      <path d="M0 30H300M0 60H300" style={{ stroke: "var(--grid)" }} fill="none" />
                      <Series
                        color="var(--s1)"
                        points="0,40 25,36 50,41 75,33 100,38 125,31 150,35 175,29 200,34 225,28 250,32 275,26 300,30"
                      />
                      <Series
                        color="var(--s2)"
                        points="0,55 25,52 50,57 75,50 100,54 125,48 150,53 175,47 200,51 225,46 250,50 275,44 300,47"
                      />
                      <Series
                        color="var(--s3)"
                        points="0,70 25,68 50,72 75,66 100,69 125,64 150,68 175,63 200,67 225,62 250,65 275,60 300,63"
                      />
                    </svg>
                  </div>
                  <div style={panelStyle}>
                    <div style={panelTitleStyle}>p99 latency</div>
                    <svg
                      viewBox="0 0 300 90"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="p99 latency crossing the warning line"
                      style={chartStyle}
                    >
                      <path
                        d="M0 34H300"
                        style={{ stroke: "var(--warn)" }}
                        strokeDasharray="4 4"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                      <Series
                        color="var(--s1)"
                        points="0,80 25,78 50,80 75,76 100,78 125,74 150,70 175,60 200,40 225,28 250,30 275,38 300,46"
                      />
                    </svg>
                  </div>
                  <div style={{ ...panelStyle, gap: 2 }}>
                    <div style={panelTitleStyle}>Error rate</div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      0.42%
                    </div>
                    <div
                      className="hint"
                      style={{ fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <span className="dot" style={{ background: "var(--ok)" }} />
                      OK, below 1%
                    </div>
                  </div>
                  {scene.showLogsPanel && (
                    <div style={{ ...panelStyle, fontSize: 11, minWidth: 0 }}>
                      <div style={panelTitleStyle}>Error logs by message</div>
                      <div style={logRowStyle}>
                        <span className="mono" style={logMessageStyle}>
                          payment provider timeout
                        </span>
                        <span>214</span>
                      </div>
                      <div style={logRowStyle}>
                        <span className="mono" style={logMessageStyle}>
                          inventory reservation failed
                        </span>
                        <span>87</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              {scene.followUp && (
                <div
                  style={{
                    ...panelStyle,
                    border: "1px solid var(--brand)",
                    boxShadow: "0 0 0 3px var(--brand-muted)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                    <span style={{ fontWeight: 500 }}>Error rate by route</span>
                    <span style={{ color: "var(--brand)", fontSize: 10.5 }}>New in v2</span>
                  </div>
                  <svg
                    viewBox="0 0 300 90"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Error rate for two routes"
                    style={chartStyle}
                  >
                    <Series
                      color="var(--s2)"
                      points="0,78 30,76 60,77 90,74 120,75 150,70 180,52 210,40 240,44 270,50 300,56"
                    />
                    <Series
                      color="var(--s3)"
                      points="0,84 30,83 60,84 90,82 120,83 150,82 180,80 210,79 240,80 270,81 300,81"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </figure>
      </div>
      <div style={stepRowStyle}>
        {STEPS.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            className={index === step ? "step step-on" : "step"}
            aria-current={index === step ? "step" : undefined}
            onClick={() => {
              setStep(index as Step)
              setPaused(true)
            }}
          >
            <i aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
