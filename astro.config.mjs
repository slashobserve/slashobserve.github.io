import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import react from "@astrojs/react"

export default defineConfig({
  site: "https://slashobserve.com",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "SlashObserve",
      disable404Route: true,
      customCss: [
        "@fontsource-variable/geist",
        "@fontsource-variable/geist-mono",
        "./src/styles/tokens.css",
      ],
    }),
    react(),
  ],
})
