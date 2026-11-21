# Narracat · 叙述猫

Narracat · 叙述猫 is a DSH bundle that turns a Narracat `.narracat` book directory into a workbench page inside DeepSeek Harness. Package: `narracat-dsh-workbench` · Plugin page: https://narracat.com/dsh

Production release 1.0.10, distilled from the user's Narracat Pro project: the book stays the source of truth on disk; DSH only adds a view, an editor and a checked writing pipeline over it.

## Status

- v1.0.10: metadata/docs patch — the plugin homepage is now https://narracat.com/dsh, the package points at its GitHub repository and issue tracker, and the usage guide's linear-writing section matches the 1.0.9 one-CTA / wait-state / persistence behavior. No writing-flow behavior changes.
- v0.1: browse + raw text editing (browser half) over a read/write API (host half).
- v0.2: `novel` Agent preset with nine read-only book tools, six Narracat skills registered, all 16 skills copied into the bundle, and a "new writing session" button in the workbench.
- v0.3: the submission pipeline (`project_chapter_submit` with check → memory → publish and returned/stopped/saved), outline submission (book/volume/chapters/chapter_edit/character), `novel_submit_review`, a manuscript guard on agent file tools, and the `write` + `plan` skills adapted and enabled.
- v0.10.1: brand unified as **Narracat · 叙述猫**; a macOS traffic-light safe area appears only when the DSH sidebar is collapsed and the page touches the window edge.
- v0.10: UI refactor — a poster shelf (generated covers, fan of book cards, keyboard/wheel switching, pointer tilt), a four-category workbench (书稿/构思/设定/资料) with a single content area and a context panel, Songti for the book's content and the host sans for the tool chrome.
- v0.11: full-flow closure — create a book from one sentence, one computed next step (setup → outline → write → done), agent `novel_journey`, completion check, and export to Word / HTML / Markdown / TXT. Also fixes multi-book session cwd, published-chapter rewrite dead ends, and the attempt budget across rewrites.
- v0.12: tracked memory — visible `tracking/` sheets (progress, chapter summaries, foreshadowing, character states), an authored memo, automatic refresh after submissions/outline/settings/memory writes, `novel_memory_brief` before drafting, and a four-tab tracking view in the workbench.
- v0.13: create + shelf polish — creating a book closes the dialog immediately, opens the new book from the create response and refreshes the shelf in the background.
- v1.0.1: shelf layout tightened; NarraCat logo added to the shelf header, sidebar icon and plugin icon; a “Contact author” entry opens a bio popup with GitHub, Xiaohongshu and WeChat QR codes, plus a desktop Pro download CTA.
- v1.0.0: distribution release — publishable package name and MIT license, DSH engine declaration, one-image localized detail page, path/security hardening (symlink and case-fold bypasses, CAS and large-file protection), required chapter events, settings-op validation, session result-shape fix, snapshot/rewrite polling fixes, and a 355-check regression suite.
- v1.0.3: right-sidebar panel redesign — stage-aware boards for premise, outline, draft prep, writing and completion; outline briefs for unwritten chapters; writing-frontier chapter list; per-book last-page restore; panel auto-refresh on turn end plus a cheap file-stamp poll (`GET /stamp`); setup now needs three of the four core premise cards before the outline step.
- v1.0.4: overview synopsis polish — a long book synopsis is clamped to two lines with expand/collapse, spans the content width, and no longer pushes the overview down; fixed the health-check link rendering its expression as text.
- v1.0.5: wide right-panel layout — the board is centered with a readable max width in fullscreen, header/footer align to it, warnings join the side rail from 620px, and reader prose stays at a 760px measure.
- v1.0.6: component reuse — the side panel now renders the workbench's own hero, journey card, sections, stat cards, chapter rows, tags, checkboxes, reading blocks and fields; only layout and compact-size overrides remain.
- v1.0.7: fixed the memory-row right meta being squeezed into a vertical column and overlapping the next row.
- v1.0.8: manuscript editing is now a page instead of a textarea — an editable 26px serif page title, a word-count/dirty kicker, no focus ring on the writing surface, `field-sizing` so only the page scrolls, a compact save/done toolbar, and save-in-place. The shelf's top-right entries share one text-link style.
- v1.0.9: one write action per screen — the app bar and directory footer no longer repeat the next step, and the chapter empty state owns the write button. Starting a background write turns the chapter page into a live writing scene (elapsed clock, indeterminate progress, skeleton prose, open-session / answer / retry actions); the running chapter is marked in the directory, and the right-sidebar panel reuses the same wait card in its board and reader. The write state is persisted per book and restored after page switches, and a finished write loads its prose automatically. All icon-only buttons gained instant hover/focus tooltips (`data-tip`); the selected segmented tab lost its black underline and the view switch stays a tab bar at every width. The sample book is reset to three written chapters.

## Layout

```
novel-workbench/
├── package.json          bundle manifest: dsh.bundle.patch + dsh.client
├── cordis.patch.yml      inserts the Host plugin row
├── index.js              Host half: same-origin JSON API under /novel-workbench/api/
├── agent.js              Agent half: preset-scoped novel tools, skills, prompt section
├── lib/project.js        .narracat reader, path guards, safe read/write
├── lib/novel-tools.js    read-only novel tool implementations
├── lib/submission.js     chapter / outline / review submission programs
├── lib/book-create.js    new-book scaffold, library defaults, folder naming
├── lib/journey.js        the single next step + completion checklist
├── lib/export.js         Word / HTML / Markdown / TXT export
├── lib/docx.js           minimal OOXML document writer (no dependencies)
├── lib/zip.js            minimal ZIP writer for the DOCX package
├── lib/tracking.js       progress / summaries / foreshadowing / character-state model
├── lib/tracking-store.js generate tracking sheets and the authored memo
├── client.js             generated browser half (edit src/client/*, not this file)
├── src/client/           shelf, workbench, views, panel, icons, CSS fragments
├── skills/               all 16 Narracat skills + references (catalog.json says what is live)
├── agents/ schemas/ templates/ docs/contracts/   Narracat agent contracts and data contracts
├── locale/{zh,en}.json   Plugin Manager display metadata
├── docs/DETAIL.md        the bundle's one-image detail document (en)
├── docs/DETAIL.zh.md     the localized detail document (zh)
├── docs/GUIDE.md         the long-form user guide
├── LICENSE NOTICE        MIT license and third-party notices
└── icon.svg              sidebar / plugin list artwork
```

## API

| Method | Route | Meaning |
| --- | --- | --- |
| GET | `/novel-workbench/api/books` | Scan every registered Workspace for `.narracat` books (root, one level, or a `books/<book>` shelf) |
| GET | `/novel-workbench/api/book?root&dir` | Full book model: volumes, chapters, characters, outline, premise, reviews, memory metadata |
| GET | `/novel-workbench/api/stamp?root&dir` | Content-free change fingerprint (newest mtime, file count, bytes) for the live side panel |
| GET | `/novel-workbench/api/file?root&dir&path` | Read one text file inside the book (2 MiB cap) |
| PUT | `/novel-workbench/api/file` | Write one text file (4 MiB cap, mtime CAS, JSON validated) |
| POST | `/novel-workbench/api/create-book` | Scaffold a new `.narracat` book and add it to the workspace registry |
| POST | `/novel-workbench/api/export` | Export the book (docx / html / md / txt) into `exports/`, with the completion checklist |
| GET | `/novel-workbench/api/export-file` | Download one file from `exports/` (path-guarded) |

All routes go through `ctx.connection.requestRejection` (login cookie + Host/Origin fence) and only accept roots that are registered Workspaces. Paths are resolved with `realpath` and must stay inside the book directory; host-maintained files (`memory.db`, submission logs, author-decision commits, revisions…) are write-denied.

## Development checks

```bash
node --check novel-workbench/index.js
node --check novel-workbench/agent.js
node dev/build-client.mjs # rebuild client.js from src/client/*.js
node --check novel-workbench/client.js
node dev/test-scan.mjs   # reader against the bundled demo book
node dev/test-api.mjs    # HTTP API against a temporary copy of the sample books
node dev/test-ui.mjs     # shelf + workbench render, create/edit/export/session flows
node dev/test-agent.mjs  # tool registration/execution, skill parsing, read-only guarantee
node dev/test-render.mjs # earlier render regression (kept for the panel/session paths)
node dev/test-flow.mjs   # create → setup → outline → write → done → export, without DSH
node dev/test-tracking.mjs # memory → summaries/states/threads/memo → sheets → brief
node dev/test-bundle.mjs   # manifest, build drift, skill catalog and route strings
node dev/test-submission.mjs # draft path traversal and the normal submit path
node dev/preview-real.mjs # screenshot the real components into dev/previews
```

## Install

From a checkout:

```text
plugin_manager install_bundle target=/absolute/path/to/novel-workbench
```

From the registry (published as `narracat-dsh-workbench`):

```text
plugin_manager install_bundle target=narracat-dsh-workbench
```

Or from the DSH UI: **Plugins → Add plugin**, type the package name, install. From a packed tarball, point the same control at the `.tgz` absolute path.

Then restart DSH; the entry appears in the left sidebar rail as **Narracat · 叙述猫**. Restarting matters because the client bundle is snapshotted at startup — a page reload alone may still serve the old bundle.
A new Session can pick the **Narracat · 叙述猫** agent preset, which mounts 38 novel tools, all 16 skills, and the one-step writing discipline.

Upgrading replaces the installed JavaScript, so restart DSH after an upgrade. The package name is also the client module id and the panel id: renaming it requires reinstalling the bundle, not just editing `package.json`.

## Distribution

```bash
pnpm pack                    # inspect the tarball, then attach it to a release
npm publish --access public  # staged publishing; approve with 2FA
```

See [`../docs/RELEASING.md`](../docs/RELEASING.md) for the full staged-publish + 2FA approval flow.

License: MIT (see `LICENSE`); bundled writing-craft references retain their
oh-story-claudecode MIT notice (see `NOTICE`).
