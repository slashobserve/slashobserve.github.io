# SlashObserve site

The marketing pages and `/docs` for slashobserve.com, currently served from GitHub Pages at https://slashobserve.github.io.
The docs content comes from `docs/` on `main` in the core repo, https://github.com/slashobserve/slashobserve, so edit docs there, not here.

## Requirements

- Bun 1.4.2, the `packageManager` version in `package.json`.
- Node 24.16.0, from `.node-version`.
- A checkout of the core repo.

## Run

```sh
bun install
export SLASHOBSERVE_CORE_DIR=/path/to/slashobserve
bun run dev
```

The prebuild reads the core repo from `SLASHOBSERVE_CORE_DIR`, or from `../slashobserve` when the variable is unset.
`bun run dev` and `bun run build` both run it first.

```sh
bun run build
bun run preview
```

`build` writes the site and its Pagefind search index to `dist/`, and `preview` serves that directory.

## Checks

```sh
bun run test
bun run check
bun run check:links
```

`test` runs the unit tests, `check` runs `astro check`, and `check:links` checks internal links in `dist/`, so run it after `build`.

## Layout

- `src/pages/`: the home, `/grafana`, `/features` and 404 pages, the docs routes and the social cards.
- `src/components/`: Astro and React components, grouped by page.
- `src/layouts/`: base, marketing and docs layouts.
- `src/styles/`: global, marketing, docs and prose styles, with the colour tokens in `tokens.css`.
- `scripts/prebuild.ts` and `scripts/sync/`: copy core's docs and schema into the site and build the importer corpus summary.
- `scripts/check-links.ts` and `scripts/links/`: the link check.
- `core-ref.txt`: the core ref that CI builds from.

The prebuild generates `src/content/docs/`, `public/schemas/` and `src/generated/`.
Git ignores them, so do not edit them by hand.

## Deploy

The Deploy workflow builds the site and publishes it to GitHub Pages on every push to `main`, nightly, on a `core-docs-changed` repository dispatch, and on manual run.
It checks out the core repo at the ref in `core-ref.txt` using the `CORE_REPO_TOKEN` repository secret.
The PR workflow runs the tests, build and checks on pull requests.

## License

Apache-2.0.
See `LICENSE` and `NOTICE`.
