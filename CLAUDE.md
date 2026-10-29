# SlashObserve site

This repo is the SlashObserve marketing site and docs, served from GitHub Pages at slashobserve.com.
Docs content is written in the core repo `slashobserve/slashobserve` under `docs/` and synced in at build time.

## Commands

| Purpose | Command |
| --- | --- |
| Install | `bun install` |
| Dev server | `bun run dev` |
| Sync docs from the core repo | `bun run sync` |
| Build (sync, then `astro build`) | `bun run build` |
| Type check (`astro check`) | `bun run check` |
| Internal link check over `dist/` | `bun run check:links` |
| Unit tests (`bun test`) | `bun run test` |

## Layout

- `src/pages/`: home and 404, later /grafana and /features.
- `src/components/site/`: shared header, footer, wordmark, theme toggle and halo.
- `src/components/home/`: home page sections.
- `src/components/starlight/`: Starlight component overrides.
- `src/layouts/`: page layouts.
- `src/lib/`: pure helpers.
- `src/styles/tokens.css`: the only colour definitions.
- `scripts/`: docs sync and link check.
- `public/CNAME`: the custom domain.
- `core-ref.txt`: the core repo ref the docs are built from.
- `src/content/docs/` and `public/schemas/`: generated, git-ignored, never edited by hand.

## Core repo

`bun run sync` reads the core repo from `SLASHOBSERVE_CORE_DIR`, else `../slashobserve`.
CI checks out the ref in `core-ref.txt` into `.core/` with the `CORE_REPO_TOKEN` secret.
Never hand-write docs pages in this repo; a docs change is a change to the core repo's `docs/`.

## Content rules

- No milestone names anywhere on the site.
- Numbers about the product come from generated data or the synced schema, never typed by hand.
- The canvas's `[N]` placeholders stay out of the page until a generator fills them.
- No analytics, cookies or third-party requests; fonts are self-hosted.
- No pricing, enterprise or blog pages.

## Design rules

- Colours only through the tokens in `src/styles/tokens.css`, never a raw hex in a component.
- Light and dark both work through `data-theme` on `<html>` and the `starlight-theme` localStorage key.
- Primary buttons use `--primary` (black in light mode).
- Blue is for the slash, eyebrows, icon chips and the step indicator.
- Never use gradient-filled text or buttons, backdrop blur, numbered section labels, emoji, stock illustrations or coloured left-border callouts.
- Docs stay calm: flat background, 1px borders, light grey sidebar.
- The design source is the Website design canvas at `../docs/site/canvas/project/*.dc.html` in the SlashObserve workspace.
- Its markup, spacing and type scale are the spec; its copy is data.

## Code rules

- TypeScript strict.
- React only for islands that need state (`client:visible`); everything else is `.astro`.
- No comments or docstrings in code; shebangs and tool pragmas are the exception.
- Never use an em dash in code, copy or docs.
- Bun is the only package manager, and every dependency is pinned to an exact version.

## Testing and gates

- Unit tests with `bun test` for pure logic only: path mapping, link rewriting, link checking, sidebar and link resolution, loop state.
- No e2e or visual tests.
- Before calling work done, run `bun run build`, `bun run check`, `bun run check:links` and `bun run test`.

## Commits

- Atomic commits.
- Messages describe the change, with no plan or milestone numbers and no co-author trailers.
