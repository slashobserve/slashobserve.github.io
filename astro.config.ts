import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { satteri } from "@astrojs/markdown-satteri"
import tailwindcss from "@tailwindcss/vite"
import { tableScroll } from "./src/lib/markdown/table-scroll"
import { codeFigure } from "./src/lib/shiki/code-figure"
import { promql } from "./src/lib/shiki/promql"

export default defineConfig({
  site: "https://slashobserve.com",
  trailingSlash: "always",
  output: "static",
  vite: { plugins: [tailwindcss()] },
  markdown: {
    processor: satteri({ hastPlugins: [tableScroll] }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      langs: [promql],
      langAlias: { clickhouse: "sql", curl: "bash", console: "bash", shellsession: "shellscript" },
      transformers: [codeFigure],
    },
  },
  integrations: [react(), sitemap()],
})
