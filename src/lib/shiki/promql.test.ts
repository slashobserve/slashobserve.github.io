import { describe, expect, test } from "bun:test"
import { promql, type PromqlRule } from "./promql"

const everyRule = [...promql.patterns, ...Object.values(promql.repository)]

function flatten(rules: PromqlRule[]): PromqlRule[] {
  return rules.flatMap((rule) => [rule, ...flatten(rule.patterns ?? [])])
}

function rulesNamed(scope: string): PromqlRule[] {
  return flatten(everyRule).filter(
    (rule) =>
      rule.name === scope ||
      Object.values(rule.captures ?? {}).some((capture) => capture.name === scope),
  )
}

function scopeMatches(scope: string, text: string): boolean {
  const matchers = rulesNamed(scope).filter((rule) => rule.match !== undefined)
  expect(matchers.length).toBeGreaterThan(0)
  return matchers.some((rule) => new RegExp(rule.match as string).test(text))
}

const cases: { scope: string; matches: string[]; nearMisses: string[] }[] = [
  { scope: "comment.line.number-sign.promql", matches: ["# note"], nearMisses: ["rate"] },
  { scope: "string.quoted.double.promql", matches: ['"api"', '"a\\"b"'], nearMisses: ["'api'"] },
  { scope: "string.quoted.single.promql", matches: ["'api'"], nearMisses: ['"api"'] },
  { scope: "string.quoted.other.promql", matches: ["`api`"], nearMisses: ['"api"'] },
  {
    scope: "constant.numeric.duration.promql",
    matches: ["[5m]", "[1h:5m]", "[1h:]", "[250ms]", "offset 5m"],
    nearMisses: ["[5x]", "[m]", "5m"],
  },
  {
    scope: "constant.numeric.promql",
    matches: ["42", "0.5", ".5", "1e3", "2.5E-3", "Inf", "NaN", "0x1f"],
    nearMisses: ["rate", "http_2xx", "5x"],
  },
  {
    scope: "keyword.operator.aggregation.promql",
    matches: ["sum", "topk", "count_values", "limit_ratio"],
    nearMisses: ["summary", "sum_over_time", "job:sum"],
  },
  {
    scope: "keyword.control.promql",
    matches: ["by", "without", "group_left", "@", "offset 5m"],
    nearMisses: ["bypass", "android", "ordinal"],
  },
  {
    scope: "support.function.promql",
    matches: ["rate(", "histogram_quantile (", "label_replace(", "sum_over_time("],
    nearMisses: ["rated(", "rate", "my_rate("],
  },
  { scope: "keyword.operator.match.promql", matches: ["=~", "!=", "!~", "="], nearMisses: ["job", "<"] },
  {
    scope: "entity.name.tag.promql",
    matches: ['job=~"api"', 'job != "x"', 'a="b"'],
    nearMisses: ['"api"', "{}"],
  },
  {
    scope: "variable.other.promql",
    matches: ["$__rate_interval", "$instance", "${cluster}"],
    nearMisses: ["rate_interval", "$ 1"],
  },
  {
    scope: "entity.name.function.metric.promql",
    matches: ["http_requests_total", "job:rate5m", ":rule"],
    nearMisses: ["123", "[]"],
  },
]

describe("promql grammar", () => {
  test("declares its language id, scope and alias", () => {
    expect(promql.name).toBe("promql")
    expect(promql.scopeName).toBe("source.promql")
    expect(promql.aliases).toEqual(["prometheus"])
  })

  for (const { scope, matches, nearMisses } of cases) {
    test(`${scope} matches its samples`, () => {
      for (const sample of matches) {
        expect([sample, scopeMatches(scope, sample)]).toEqual([sample, true])
      }
    })

    test(`${scope} rejects near misses`, () => {
      for (const sample of nearMisses) {
        expect([sample, scopeMatches(scope, sample)]).toEqual([sample, false])
      }
    })
  }

  test("every pattern regex compiles", () => {
    const sources = flatten(everyRule)
      .flatMap((rule) => [rule.match, rule.begin, rule.end])
      .filter((source) => source !== undefined)
    expect(sources.length).toBeGreaterThan(10)
    for (const source of sources) expect(() => new RegExp(source)).not.toThrow()
  })
})
