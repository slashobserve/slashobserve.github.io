type Captures = Record<string, { name: string }>

export type PromqlRule = {
  name?: string
  match?: string
  begin?: string
  end?: string
  include?: string
  captures?: Captures
  patterns?: PromqlRule[]
}

export type PromqlGrammar = {
  name: string
  scopeName: string
  aliases: string[]
  patterns: PromqlRule[]
  repository: Record<string, PromqlRule>
}

const duration = "[0-9]+(?:ms|[smhdwy])"

function words(list: string): string {
  return `(?<![\\w:])(?:${list.split(" ").join("|")})(?![\\w:])`
}

function calls(list: string): string {
  return `(?<![\\w:])(?:${list.split(" ").join("|")})(?=\\s*\\()`
}

const aggregations = words(
  "sum min max avg group stddev stdvar count count_values bottomk topk quantile limitk limit_ratio",
)

const keywords = `${words("by without on ignoring group_left group_right offset bool and or unless")}|@`

const functions = calls(
  [
    "rate irate increase delta idelta deriv predict_linear",
    "histogram_quantile histogram_count histogram_sum histogram_fraction",
    "label_replace label_join abs ceil floor round clamp clamp_min clamp_max",
    "exp ln log2 log10 sqrt time timestamp vector scalar sort sort_desc",
    "absent absent_over_time changes resets",
    "day_of_month day_of_week day_of_year days_in_month hour minute month year",
    "avg_over_time min_over_time max_over_time sum_over_time count_over_time",
    "quantile_over_time stddev_over_time stdvar_over_time last_over_time",
    "present_over_time holt_winters sgn",
  ].join(" "),
)

const number =
  "(?<![\\w:.])(?:0[xX][0-9a-fA-F]+|(?:[0-9]+\\.?[0-9]*|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?|[Ii][Nn][Ff]|[Nn][Aa][Nn])(?![\\w:])"

export const promql: PromqlGrammar = {
  name: "promql",
  scopeName: "source.promql",
  aliases: ["prometheus"],
  patterns: [
    { name: "comment.line.number-sign.promql", match: "#.*$" },
    { include: "#strings" },
    {
      name: "constant.numeric.duration.promql",
      match: `\\[${duration}(?::(?:${duration})?)?\\]`,
    },
    {
      match: `\\b(offset)\\s+(-?${duration})(?![\\w:])`,
      captures: {
        "1": { name: "keyword.control.promql" },
        "2": { name: "constant.numeric.duration.promql" },
      },
    },
    { name: "constant.numeric.promql", match: number },
    { name: "keyword.operator.aggregation.promql", match: aggregations },
    { name: "keyword.control.promql", match: keywords },
    { name: "support.function.promql", match: functions },
    {
      begin: "\\{",
      end: "\\}",
      patterns: [
        { include: "#strings" },
        { name: "keyword.operator.match.promql", match: "=~|!=|!~|=" },
        {
          name: "entity.name.tag.promql",
          match: "[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*(?:=~|!=|!~|=))",
        },
      ],
    },
    {
      name: "variable.other.promql",
      match: "\\$__[a-z_]+|\\$\\{?[A-Za-z_][A-Za-z0-9_]*\\}?",
    },
    { name: "entity.name.function.metric.promql", match: "[a-zA-Z_:][a-zA-Z0-9_:]*" },
  ],
  repository: {
    strings: {
      patterns: [
        { name: "string.quoted.double.promql", match: '"(?:[^"\\\\]|\\\\.)*"' },
        { name: "string.quoted.single.promql", match: "'(?:[^'\\\\]|\\\\.)*'" },
        { name: "string.quoted.other.promql", match: "`[^`]*`" },
      ],
    },
  },
}
