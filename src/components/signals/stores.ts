export type Language = string | null

export interface Store {
  store: string
  metrics: Language
  logs: Language
  traces: Language
  discovery: string
}

export const stores: Store[] = [
  {
    store: "Prometheus",
    metrics: "PromQL",
    logs: null,
    traces: null,
    discovery: "metric inventory by family, labels, label values, series per family",
  },
  {
    store: "ClickHouse",
    metrics: "SQL",
    logs: "SQL",
    traces: "SQL",
    discovery: "tables in the configured database, columns and types, sample rows",
  },
  {
    store: "Loki",
    metrics: null,
    logs: "LogQL",
    traces: null,
    discovery: "stream labels and values, line samples",
  },
  {
    store: "Elasticsearch",
    metrics: null,
    logs: "KQL, Lucene, Query DSL",
    traces: null,
    discovery: "fields and kinds from the mapping, values per field, sample documents",
  },
  {
    store: "OpenSearch",
    metrics: null,
    logs: "KQL, Lucene, Query DSL",
    traces: null,
    discovery: "fields and kinds from the mapping, values per field, sample documents",
  },
  {
    store: "Tempo",
    metrics: null,
    logs: null,
    traces: "TraceQL",
    discovery: "service names, span names, attribute keys and values",
  },
]

export function languagesOf({ metrics, logs, traces }: Store): string {
  const named = [metrics, logs, traces].filter((language): language is string => language !== null)
  return [...new Set(named)].join(", ")
}
