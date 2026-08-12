# MonoMap

A single-purpose, keyboard-first, local-first mind map. One tool, one job, zero bloat.

MonoMap runs entirely in the browser: your maps live in your device's storage (IndexedDB), work offline,
and are never uploaded to a server. There's no account, no sign-up, no cloud — just an infinite canvas and
your keyboard.

![og image](static/og-image.png)

## Features

- **Infinite canvas** — pan and zoom (25–250%), drag nodes anywhere; world-anchored dotted background
  (toggleable from **Preferences → Background Dots**).
- **Speed-of-thought editing** — `Tab` to branch, `Enter` to continue, `Space` or a click/tap to edit text,
  arrows to navigate, `Del` to delete. A `+` button on each node creates children too.
- **Right settings panel** — colors, emoji icons, hyperlinks (auto `https://`), and plain-text notes per node.
- **Live Markdown split view** — type an outline on the left, watch the map build itself on the right
  (`Ctrl/Cmd + M`).
- **Organized workspace** — folders, multiple tabs (`Ctrl/Cmd + T` / `W`), drag-and-drop organization,
  inline rename (double-click).
- **Local-first** — debounced autosave to IndexedDB; export maps to `.md` / `.png`, back up the whole
  profile as `.json`, and import `.md`/`.txt`/profiles.
- **Keyboard shortcuts bar** — a bottom bar listing the core shortcuts (toggleable from the sidebar).
- **Landing page** — a server-rendered marketing site (`/`) with analytics and Privacy/Terms pages; the app
  lives at `/workspace`.

## Tech Stack

| Layer        | Technology                         |
| ------------ | ---------------------------------- |
| Framework    | Svelte 5 + SvelteKit 2 (runes)     |
| Styling      | Tailwind CSS v4 + CSS variables    |
| Canvas       | Hybrid SVG + DOM (Bezier lines)    |
| Storage      | IndexedDB via `idb-keyval`         |
| Build        | `@sveltejs/adapter-static` (static)|

## Getting Started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
```

Routes in development: `/` is the landing page, `/workspace` is the app.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build → build/
npm run preview    # serve the production build
npm run check      # svelte-check type/lint diagnostics
npm test           # unit tests (Vitest)
npm run test:e2e   # Playwright browser tests (Chromium)
npm run og:image   # regenerate the Open Graph image
```

## Project Structure

```
src/
  app.html              shared HTML shell (theme pre-paint, Google Analytics)
  app.css               Tailwind v4 + theme variables
  routes/
    +page.svelte        MonoMap landing page (SSR, prerendered at /)
    privacy/+page.svelte  Privacy Policy
    terms/+page.svelte    Terms of Service
    workspace/+page.svelte  the app (client-rendered at /workspace)
  lib/
    components/         Canvas, Node, Sidebar, NodePanel, MdPane, …
    stores/             workspace, canvas, theme, settings, ui
    db/idb.ts           IndexedDB persistence (debounced autosave)
    profile.ts          full workspace + settings backup (save/import)
    types/ utils/ data/ supporting modules
e2e/                     Playwright specs (desktop + mobile viewport)
deploy/nginx.conf.example  nginx site configuration
DEPLOY.md               CloudPanel/nginx/Cloudflare go-live guide
SPEC.md                 detailed application specification
```

## Testing

- **Unit** (`npm test`): tree ops, Bezier math, Markdown renderer, import/export + layout, the split-view
  sync engine, URL normalization, workspace store.
- **End-to-end** (`npm run test:e2e`): real-browser coverage of the desktop app, the landing/legal pages,
  and a mobile viewport (touch pan, pinch zoom, tap-to-edit, bottom sheets).

## Deployment

The build is a fully static site. See **[DEPLOY.md](DEPLOY.md)** for the CloudPanel/nginx/Cloudflare
go-live steps (upload `build/`, apply the SPA fallback + headers, configure DNS/SSL, submit the sitemap).

## License / Contact

MonoMap is a product by **Tehnika**. Contact: [hello@tehnika.mk](mailto:hello@tehnika.mk) ·
[tehnika.mk](https://www.tehnika.mk)
