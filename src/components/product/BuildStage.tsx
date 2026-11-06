import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import {
  BUILD_TITLE,
  PANEL_COUNT,
  SAVE_MS,
  buildStatus,
  composerText,
  nextStep,
  panelShown,
  playLabel,
  runningFor,
  stepSummary,
  timeline,
  topRowTitle,
  type PlayPhase,
} from "../../lib/build-play"

const REQUEST_ID = "7c2e91a4-5b0d-4e8f-9a1c-3d6f2b8e4a17"
const PROMPT = "checkout health by pod, last 6h"
const X_TICKS = ["08:00", "10:00", "12:00", "14:00"]

type Series = { d: string; tone: string; name: string }

const ERROR_ROWS = [
  ["/checkout", "41", "0.9%"],
  ["/cart", "3", "0.1%"],
  ["/product/{id}", "0", "0.0%"],
  ["/search", "1", "0.0%"],
] as const

const POOL_BARS = [30, 45, 40, 70, 95, 80, 55, 50, 60, 48]
const POOL_PEAK = 4

const PODS: Series[] = [
  { d: "M0 96 C40 90 60 54 100 60 S170 108 210 76 S290 32 330 44 S380 76 400 66", tone: "s1", name: "checkout-0" },
  { d: "M0 108 C40 104 60 86 100 90 S170 120 210 104 S290 76 330 82 S380 104 400 98", tone: "s2", name: "checkout-1" },
  { d: "M0 76 C40 82 60 64 100 54 S170 48 210 64 S290 86 330 74 S380 64 400 70", tone: "s3", name: "checkout-2" },
]

const ROUTES: Series[] = [
  { d: "M0 86 L50 84 L100 76 L150 78 L200 52 L250 32 L300 40 L350 66 L400 70", tone: "s1", name: "/checkout" },
  { d: "M0 108 L50 106 L100 104 L150 105 L200 98 L250 92 L300 94 L350 102 L400 103", tone: "s2", name: "/cart" },
]

function PanelHead({ title }: { title: string }) {
  return (
    <div className="pt stage-pt">
      <span className="stage-pt-title">{title}</span>
      <span className="k" aria-hidden="true">
        ⋯
      </span>
    </div>
  )
}

function Stat({ title, value, unit, ok = false }: { title: string; value: string; unit?: string; ok?: boolean }) {
  return (
    <>
      <PanelHead title={title} />
      <div className="stage-stat">
        <span className="stage-stat-value">
          {value}
          {unit && <span className="stage-stat-unit">{unit}</span>}
        </span>
        {ok && (
          <span className="k stage-stat-ok">
            <span className="fg-ok" aria-hidden="true">
              ✓
            </span>{" "}
            OK
          </span>
        )}
      </div>
    </>
  )
}

function TimeSeries({ title, yTicks, series }: { title: string; yTicks: string[]; series: Series[] }) {
  return (
    <>
      <PanelHead title={title} />
      <div className="stage-ts">
        <div className="stage-y k" aria-hidden="true">
          {yTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
        <svg className="stage-chart" viewBox="0 0 400 130" preserveAspectRatio="none" aria-hidden="true">
          {series.map(({ d, tone }) => (
            <path key={tone} d={d} fill="none" stroke={`var(--${tone})`} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <div className="stage-x k" aria-hidden="true">
          {X_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
      <div className="stage-legend k">
        {series.map(({ tone, name }) => (
          <span key={name}>
            <i className={`tone-${tone}`} aria-hidden="true" />
            {name}
          </span>
        ))}
      </div>
    </>
  )
}

type Size = "quarter" | "wide" | "third"

const ROWS: { title: string; panels: { size: Size; body: ReactNode }[] }[] = [
  {
    title: "Overview",
    panels: [
      { size: "quarter", body: <Stat title="Requests/s" value="1.9k" unit="req/s" /> },
      { size: "quarter", body: <Stat title="Error ratio" value="0.4" unit="%" ok /> },
      { size: "quarter", body: <Stat title="p95 latency" value="212" unit="ms" /> },
      { size: "quarter", body: <Stat title="Pods ready" value="3" /> },
    ],
  },
  {
    title: "Traffic",
    panels: [
      { size: "wide", body: <TimeSeries title="Requests by pod" yTicks={["900 req/s", "450 req/s", "0 req/s"]} series={PODS} /> },
      { size: "wide", body: <TimeSeries title="Latency by route" yTicks={["400 ms", "200 ms", "0 s"]} series={ROUTES} /> },
      {
        size: "wide",
        body: (
          <>
            <PanelHead title="Errors by route" />
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
    ],
  },
  {
    title: "Internals",
    panels: [
      {
        size: "wide",
        body: (
          <>
            <PanelHead title="DB pool in use" />
            <div className="stage-bars">
              {POOL_BARS.map((h, i) => (
                <i key={i} className={i === POOL_PEAK ? "tone-warn" : "tone-s1"} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="stage-legend k">
              <span>
                <i className="tone-s1" aria-hidden="true" />
                in use
              </span>
            </div>
          </>
        ),
      },
      { size: "third", body: <Stat title="Queue depth" value="18" /> },
      { size: "third", body: <Stat title="Payment success" value="99.1" unit="%" ok /> },
      { size: "third", body: <Stat title="Reservations/s" value="64" unit="req/s" /> },
      { size: "third", body: <Stat title="Cache hit ratio" value="94" unit="%" /> },
    ],
  },
]

const ROW_STARTS = ROWS.map((_, i) => ROWS.slice(0, i).reduce((count, row) => count + row.panels.length, 0))

function Running({ step }: { step: number }) {
  const phases = timeline(step)
  return (
    <div className="stage-turn-body">
      {step === 0 ? (
        <span className="stage-status-line">
          <span className="stage-spin" aria-hidden="true" />
          {buildStatus(step)}
        </span>
      ) : (
        <div className="stage-card stage-status-line">
          <span className="stage-spin" aria-hidden="true" />
          {buildStatus(step)}
        </div>
      )}
      <ol className="stage-phases">
        {phases.map(({ label, tools, messages }) => {
          const single = messages.length === 1
          const open = label === "Saving" && !single
          return (
            <li key={label}>
              <span className="fg-ok" aria-hidden="true">
                ✓
              </span>
              <span className="stage-phase">
                <span className="stage-phase-line">
                  <span>{label}</span>
                  <span className="k">{tools}</span>
                  {single && <span className="k">{messages[0]}</span>}
                  {!single && !open && <span className="k stage-show">Show {messages.length} steps</span>}
                </span>
                {open && messages.map((message) => <span key={message} className="k">{message}</span>)}
              </span>
            </li>
          )
        })}
        <li>
          <span className="stage-spin" aria-hidden="true" />
          <span>Working</span>
        </li>
      </ol>
      <span className="k stage-small">{runningFor(step)}</span>
    </div>
  )
}

function Finished() {
  return (
    <div className="stage-turn-body">
      <span className="k stage-summary">
        <span aria-hidden="true">▸</span> {stepSummary()}
      </span>
      <div className="stage-card">
        <div className="stage-thumbs" aria-hidden="true">
          {[PODS, ROUTES].map((series, i) => (
            <div key={i} className="stage-thumb">
              <svg viewBox="0 0 400 130" preserveAspectRatio="none">
                <path d={series[0].d} fill="none" stroke="var(--s1)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          ))}
        </div>
        <div className="stage-result">
          <span className="stage-result-text">
            <span className="label">{BUILD_TITLE}</span>
            <span className="k">{PANEL_COUNT} panels from prom</span>
          </span>
          <span className="btn btn-primary btn-sm">Open dashboard</span>
        </div>
        <span className="k stage-saved">
          <span className="fg-ok" aria-hidden="true">
            ✓
          </span>{" "}
          Saved as version 1, just now
        </span>
      </div>
      <span className="k stage-small">Request {REQUEST_ID.slice(0, 8)}</span>
    </div>
  )
}

export default function BuildStage() {
  const [step, setStep] = useState(PANEL_COUNT)
  const [phase, setPhase] = useState<PlayPhase>("ready")
  const [reducedMotion, setReducedMotion] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const conversation = useRef<HTMLDivElement>(null)

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
    const pane = conversation.current
    if (pane) pane.scrollTop = pane.scrollHeight
  }, [step, phase])

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

  const playing = phase === "playing"
  const composer = composerText(!playing)

  return (
    <div className="win stage" role="group" aria-label="A build, played back">
      <div className="winbar">
        <span className="lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="url stage-url">observe.example.com/b/{REQUEST_ID}</span>
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
          <div ref={conversation} className="stage-conversation">
            <div className="stage-bubble">{PROMPT}</div>
            <div className="stage-turn">
              <span className="stage-tile" aria-hidden="true">
                /
              </span>
              {playing ? <Running step={step} /> : <Finished />}
            </div>
          </div>
          <div className="stage-composer">
            <div className="stage-composer-box">
              <span className="k">{composer.placeholder}</span>
              <span className="stage-send" aria-hidden="true">
                ↑
              </span>
            </div>
            <span className="k stage-note">{composer.note}</span>
          </div>
        </div>
        <div className="stage-main">
          <div className="stage-top">
            <span className="stage-mark" aria-hidden="true">
              /
            </span>
            <span className="k">/</span>
            <span className="k">Dashboards</span>
            <span className="k">/</span>
            <span className="label">{topRowTitle(step)}</span>
          </div>
          {ROWS.map(({ title, panels }, rowIndex) => {
            const start = ROW_STARTS[rowIndex]
            const rowShown = panelShown(step, start + 1)
            return (
              <section key={title} className={rowShown ? "stage-row" : "stage-row hidden-step"}>
                <div className="stage-row-head">
                  <span className="k" aria-hidden="true">
                    ⌄
                  </span>{" "}
                  {title}
                </div>
                <div className="stage-grid">
                  {panels.map(({ size, body }, i) => {
                    const shown = panelShown(step, start + i + 1)
                    const className = ["panel", `stage-${size}`, !shown && "hidden-step"].filter(Boolean).join(" ")
                    return (
                      <div key={i} className={className}>
                        {body}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === "done" ? `Build finished: version 1, ${PANEL_COUNT} panels` : ""}
      </p>
    </div>
  )
}
