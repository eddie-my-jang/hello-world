# CLAUDE.md

This file provides guidance for AI assistants working with this repository.

## Project Overview

A minimal static **GitHub Pages** website — the standard GitHub "hello-world" starter. It renders a single HTML page served directly from the repository root via GitHub Pages.

## Repository Structure

```
hello-world/
├── index.html        # Entry point — the GitHub Pages home page
├── styles.css        # Global stylesheet (linked from index.html)
├── images/
│   └── create-octocat.png  # Static image asset
└── README.md         # GitHub onboarding guide (not part of the website)
```

No build step, no package manager, no dependencies — all files are served as-is.

## Key Files

### `index.html`
- DOCTYPE HTML5, UTF-8 charset
- Links `styles.css` via a `<LINK>` tag in `<head>` (note: uppercase `LINK` tag — preserve this)
- Displays an Octocat GIF from `octodex.github.com` as the hero image (`id="octocat"`)
- Contains a single `<p>` placeholder on line 15 — this is the intended customization point

### `styles.css`
- Resets all margin/padding to `0`
- Centers `#octocat` image: `width: 384px`, `margin: 50px auto`
- Centers `<p>` text: `width: 400px`, monospace font stack at `30px`

### `images/`
- Static assets referenced directly from HTML or README
- Do not reorganize or rename without updating all references

## Development Workflow

This is a pure static site — there is no build process.

1. Edit files directly (`index.html`, `styles.css`, or assets in `images/`)
2. Preview by opening `index.html` in a browser locally
3. Commit and push — GitHub Pages deploys automatically from the `master` branch

## Conventions

- **No build tooling** — do not introduce npm, bundlers, or preprocessors unless explicitly requested
- **No framework** — keep HTML/CSS vanilla
- **Preserve existing tag style** — the `<LINK>` tag in `index.html` uses uppercase; do not normalize it without explicit instruction
- **Images go in `images/`** — place any new image assets there
- **CSS is global** — there is only one stylesheet; add new rules to `styles.css`
- **Commit messages** should be short and descriptive (e.g., `Update intro paragraph`, `Add profile image`)

## Git Branches

| Branch | Purpose |
|--------|---------|
| `master` | Production branch — served by GitHub Pages |
| `claude/*` | AI-assisted development branches |

Always develop on the designated `claude/` branch and open a pull request to `master`.

## GitHub Pages Deployment

- Served automatically from the `master` branch root
- `index.html` is the entry point
- No `_config.yml` or Jekyll configuration — the site is plain HTML, not Jekyll-processed
- Changes pushed to `master` are live within seconds
