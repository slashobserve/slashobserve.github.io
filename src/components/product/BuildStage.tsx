import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import {
  PANEL_COUNT,
  RAIL_ROWS,
  SAVE_MS,
  nextStep,
  panelShown,
  playLabel,
  railLines,
  windowStatus,
  type PlayPhase,
} from "../../lib/build-play"

const ERROR_ROWS = [
  ["/checkout", "41", "0.9%"],
  ["/cart", "3", "0.1%"],
  ["/product/{id}", "0", "0.0%"],
  ["/search", "1", "0.0%"],
] as const

const POOL_BARS = [30, 45, 40, 70, 95, 80, 55, 50, 60, 48]
const POOL_PEAK = 4

function Stat({ title, value, ok = false }: { title: string; value: string; ok?: boolean }) {
  return (
    <>
      <div className="pt">{title}</div>
      <div className={ok ? "pv fg-ok" : "pv"}>{value}</div>
    </>
  )
}

function WideTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="pt">
      <span>{title}</span>
      <span className="k">{meta}</span>
    </div>
  )
}

function Chart({ lines }: { lines: { d: string; tone: string }[] }) {
  return (
    <svg className="stage-chart" viewBox="0 0 400 130" preserveAspectRatio="none" aria-hidden="true">
      {lines.map(({ d, tone }) => (
        <path key={tone} d={d} fill="none" stroke={`var(--${tone})`} strokeWidth="1.5" />
      ))}
    </svg>
  )
}

const PANELS: { wide: boolean; body: ReactNode }[] = [
  { wide: false, body: <Stat title="Requests/s" value="1.9k" /> },
  { wide: false, body: <Stat title="Error ratio" value="0.4%" ok /> },
  { wide: false, body: <Stat title="p95 latency" value="212 ms" /> },
  { wide: false, body: <Stat title="Pods ready" value="3 / 3" /> },
  {
    wide: true,
    body: (
      <>
        <WideTitle title="Requests by pod" meta="6h" />
        <Chart
          lines={[
            { d: "M0 96 C40 90 60 54 100 60 S170 108 210 76 S290 32 330 44 S380 76 400 66", tone: "s1" },
            { d: "M0 108 C40 104 60 86 100 90 S170 120 210 104 S290 76 330 82 S380 104 400 98", tone: "s2" },
            { d: "M0 76 C40 82 60 64 100 54 S170 48 210 64 S290 86 330 74 S380 64 400 70", tone: "s3" },
          ]}
        />
      </>
    ),
  },
  {
    wide: true,
    body: (
      <>
        <WideTitle title="Latency by route" meta="p50 · p95" />
        <Chart
          lines={[
            { d: "M0 86 L50 84 L100 76 L150 78 L200 52 L250 32 L300 40 L350 66 L400 70", tone: "s4" },
            { d: "M0 108 L50 106 L100 104 L150 105 L200 98 L250 92 L300 94 L350 102 L400 103", tone: "s1" },
          ]}
        />
      </>
    ),
  },
  {
    wide: true,
    body: (
      <>
        <WideTitle title="Errors by route" meta="table" />
        <div className="stage-table">
          <span className="k">route</span>
          <span className="k">errors</span>
          <span className="k">ratio</span>
          {ERROR_ROWS.map(([route, errors, ratio], i) => (
            <Fragment key={route}>
              <span className="mono">{route}</span>
              <span>{errors}</span>
              <span className={i === 0 ? "fg-crit" : undefined}>{ratio}</span>
            </Fragment>
          ))}
        </div>
      </>
    ),
  },
  {
    wide: true,
    body: (
      <>
        <WideTitle title="DB pool in use" meta="max 20" />
        <div className="stage-bars">
          {POOL_BARS.map((h, i) => (
            <i key={i} className={i === POOL_PEAK ? "tone-warn" : "tone-s1"} style={{ height: `${h}%` }} />
          ))}
        </div>
      </>
    ),
  },
  { wide: false, body: <Stat title="Queue depth" value="18" /> },
  { wide: false, body: <Stat title="Payment success" value="99.1%" ok /> },
  { wide: false, body: <Stat title="Reservations/s" value="64" /> },
  { wide: false, body: <Stat title="Cache hit ratio" value="94%" /> },
]

export default function BuildStage() {
  const [step, setStep] = useState(PANEL_COUNT)
  const [phase, setPhase] = useState<PlayPhase>("ready")
  const [reducedMotion, setReducedMotion] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  function stop() {
    clearInterval(timer.current)
    timer.current = undefined
  }

  function play() {
    stop()
    setStep(0)
    setPhase("playing")
    let current = 0
    timer.current = setInterval(() => {
      current = nextStep(current)
      setStep(current)
      if (current === PANEL_COUNT) {
        stop()
        setPhase("done")
      }
    }, SAVE_MS)
  }

  useEffect(() => stop, [])

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => {
      setReducedMotion(query.matches)
      if (!query.matches) return
      stop()
      setStep(PANEL_COUNT)
      setPhase("ready")
    }
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])

  const lines = railLines(step)
  const playing = phase === "playing"

  return (
    <div className="win stage" role="group" aria-label="A build, played back">
      <div className="winbar">
        <span className="lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="url stage-url">observe.example.com/b/7c2e</span>
        <span className="mono stage-status">{windowStatus(step)}</span>
        {!reducedMotion && (
          <button
            type="button"
            className="btn btn-primary btn-sm stage-play"
            onClick={playing ? undefined : play}
            aria-disabled={playing}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {playLabel(phase)}
          </button>
        )}
      </div>
      <div className="stage-body">
        <div className="stage-rail">
          <div className="stage-you">
            <span className="hint">You</span>
            <div className="mono stage-prompt">checkout health by pod, last 6h</div>
          </div>
          <div className="stage-agent">
            <span className="hint">Agent</span>
            {Array.from({ length: RAIL_ROWS }, (_, i) => {
              const line = lines[i]
              if (!line) {
                return (
                  <div key={i} className="act stage-act-empty" aria-hidden="true">
                    <span className="dot" />
                    <span>{" "}</span>
                  </div>
                )
              }
              return (
                <div key={i} className="act">
                  <span className={line.tone === "active" ? "dot tone-s1" : "dot tone-ok"} />
                  <span>{line.text}</span>
                </div>
              )
            })}
          </div>
          <div className="stage-next">
            <div className="mono stage-next-box">Add a latency row by route…</div>
          </div>
        </div>
        <div className="stage-grid">
          {PANELS.map(({ wide, body }, i) => {
            const shown = panelShown(step, i + 1)
            const className = ["panel", wide && "stage-wide", !shown && "hidden-step"].filter(Boolean).join(" ")
            return (
              <div key={i} className={className}>
                {body}
              </div>
            )
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === "done" ? "Build finished: version 1, 12 panels" : ""}
      </p>
    </div>
  )
}
