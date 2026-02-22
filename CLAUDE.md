# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Project Overview

This is a **static GitHub Pages starter website** — the official GitHub "hello-world" onboarding template. It is a minimal, dependency-free project consisting of plain HTML and CSS, designed to introduce new developers to GitHub fundamentals.

- **Purpose:** Educational template for learning Git, GitHub, and GitHub Pages
- **Deployment:** Automatically published via GitHub Pages on every push to the default branch
- **Live URL pattern:** `https://<username>.github.io/` (after renaming the repo to `<username>.github.io`)

## Repository Structure

```
hello-world/
├── index.html          # Home page — the only HTML file served by GitHub Pages
├── styles.css          # Global stylesheet for the page
├── images/
│   └── create-octocat.png   # Local image asset (270 KB PNG)
└── README.md           # GitHub onboarding guide (not part of the site itself)
```

There are no build tools, package managers, preprocessors, or test frameworks. Every file is used as-is.

## Key Files

### `index.html`
- Standard HTML5 document (18 lines)
- Links to `styles.css` via a `<LINK>` element
- Displays an external Octocat GIF from `https://octodex.github.com/` as `id="octocat"`
- Contains a single `<p>` tag on line 15 — this is the primary content area intended to be customized by the user
- No JavaScript anywhere in the project

### `styles.css`
- Global CSS reset: `margin: 0; padding: 0` applied to `*`
- `#octocat` — block element, fixed 384 px width, centered with `margin: 50px auto`
- `p` — block element, fixed 400 px width, centered, 30 px monospace font (Monaco → Courier New → DejaVu Sans Mono → Bitstream Vera Sans Mono → generic monospace)
- No media queries, no variables, no preprocessor syntax

### `README.md`
- GitHub's official onboarding walkthrough
- Not rendered by GitHub Pages — only visible on the repository page

## Development Workflow

There is no build step. To preview changes locally, open `index.html` directly in a browser or serve the directory with any static file server, for example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Making Changes

1. Edit `index.html` to update page content (the `<p>` on line 15 is the main text area).
2. Edit `styles.css` to change appearance.
3. Commit and push — GitHub Pages deploys automatically.

### Common Customizations

- **Replace the welcome message:** Edit the `<p>` tag content on line 15 of `index.html`.
- **Replace the Octocat image:** Change the `src` attribute on line 12 of `index.html` to a different URL or a local image path.
- **Adjust layout widths:** Edit the `width` values in `styles.css` for `#octocat` and `p`.

## Conventions

- **No dependencies** — do not introduce `package.json`, build tools, or third-party libraries unless the project purpose is fundamentally changed.
- **No JavaScript** — the current project contains none; keep additions minimal and purposeful if JS is ever needed.
- **Indentation:** 2 spaces (as seen in existing HTML and CSS).
- **CSS selectors:** element selectors (`p`, `*`) and ID selectors (`#octocat`) only — no class-based selectors exist yet.
- **Image assets** go in the `images/` directory.
- **No `.gitignore`** is present; there are no generated or ignored files to worry about.

## Git & Branch Information

- **Default branch:** `master`
- **Remote:** `http://local_proxy@127.0.0.1:32037/git/eddie-my-jang/hello-world`
- **Initial commit:** `d40a3d9` (September 16, 2019) by eddie-my-jang

## Deployment

GitHub Pages is enabled on this repository. Pushing to the default branch publishes changes immediately — no manual deploy step is required.
