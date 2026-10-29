import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import react from "@astrojs/react"
import { buildSidebar, readDocsTree } from "./src/lib/docs-sidebar.ts"

const tree = readDocsTree("src/content/docs/docs")

export default defineConfig({
  site: "https://slashobserve.com",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "SlashObserve",
      disable404Route: true,
      sidebar: buildSidebar(tree.rootPages, tree.sections),
      customCss: [
        "@fontsource-variable/geist",
        "@fontsource-variable/geist-mono",
        "./src/styles/tokens.css",
        "./src/styles/docs.css",
      ],
      components: {
        Header: "./src/components/starlight/Header.astro",
        PageSidebar: "./src/components/starlight/PageSidebar.astro",
        TwoColumnContent: "./src/components/starlight/TwoColumnContent.astro",
        SiteTitle: "./src/components/starlight/SiteTitle.astro",
        SocialIcons: "./src/components/starlight/SocialIcons.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
        PageTitle: "./src/components/starlight/PageTitle.astro",
        EditLink: "./src/components/starlight/EditLink.astro",
      },
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        styleOverrides: {
          borderRadius: "10px",
          borderColor: "var(--border)",
          codeBackground: "var(--bg)",
          codeFontFamily: "var(--font-mono)",
          codeFontSize: "13px",
          codeLineHeight: "1.65",
          frames: {
            shadowColor: "transparent",
            editorTabBarBackground: "var(--chrome)",
            terminalTitlebarBackground: "var(--chrome)",
            frameBoxShadowCssValue: "none",
          },
        },
      },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
    react(),
  ],
})
