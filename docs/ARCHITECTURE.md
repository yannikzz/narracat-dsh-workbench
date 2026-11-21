# Architecture

This document is a map for contributors. The deep product behavior lives in [PRODUCT-FULL-FLOW.md](PRODUCT-FULL-FLOW.md), the memory model in [MEMORY-TRACKING.md](MEMORY-TRACKING.md), and the usage guide in [../novel-workbench/docs/GUIDE.md](../novel-workbench/docs/GUIDE.md).

## Three halves

| Half | Runtime | Files | Responsibility |
| --- | --- | --- | --- |
| Host | DSH process | `novel-workbench/index.js`, `lib/` | Same-origin JSON API under `/novel-workbench/api/`: scan books, read/write book files, create a book, export, refresh tracking. Runs outside the page. |
| Agent | DSH session | `novel-workbench/agent.js` | 38 novel tools, 16 skills, the Narracat preset and its system prompt. The Agent reads context, drafts, and submits; it cannot write published files directly. |
| Client | DSH Web page | `novel-workbench/client.js` (built from `src/client/`) | Shelf, workbench shell, directory, chapter/character/outline/premise/memory/review/file views, right context panel, session view. |

The package manifest declares `dsh.bundle.patch` and the Client entry; the patch inserts the Host and preset rows. The bundle is installed into a DSH profile with `dsh plugin add` (or the UI), and DSH restarts to load the new client bundle.

## Book model

A book is a directory with `.narracat/config.yaml`. The Host scans the workspace for that marker; nothing is imported or copied.

```
我的书/
├── .narracat/
│   ├── config.yaml
│   ├── data/            # outline, premise cards, character identities, reviews
│   ├── memory/          # one chapter memory per chapter
│   ├── staging/         # drafts submitted by the Agent
│   ├── revisions/       # rewrite drafts
│   ├── submissions/     # submission journal
│   ├── context-packs/   # generated writing context
│   ├── entities/        # name registry
│   └── memory.db        # optional SQLite memory (protected)
├── manuscript/          # published chapter files
├── bible/               # authored characters, world, relationships
├── tracking/            # generated progress/summary/threads/state sheets + memo
└── exports/             # Word / HTML / Markdown / TXT
```

The `.narracat` directory is the source of truth. `tracking/` is a derived, readable projection; the memo is the only hand-editable tracking file.

## Write path

The Agent writes drafts to `.narracat/staging/` and submits through the submission program:

```
context pack → draft → checks (words / prose hygiene / memory completeness)
            → record chapter memory → publish manuscript file → refresh tracking
```

Host guards:

- reject paths outside the book, `..`, backslashes, symlink escapes, case-fold aliases;
- protect `.narracat/memory/`, `reviews/`, `submissions/`, `tracking` generated sheets and `memory.db`;
- compare mtime/size before replacing a file (CAS), serialize writes per path;
- return a failed state rather than silently overwriting a newer file.

The Client never writes a published file directly except through the explicit editor save route, which also uses the CAS check. Rewrites use `.narracat/revisions/` and are published through the same submission program only after review.

## Client structure

The Client is a single generated file (`client.js`) because a DSH bundle ships one browser module. Source fragments in `src/client/`:

| Fragment | Contents |
| --- | --- |
| `00-head` `10-copy` `15-copy-extra` | Module loader, i18n dictionaries |
| `12-logo` `13-contact` `40-icons` | Brand assets, icon set, `IconButton` |
| `20-util` `30-css` | Shared helpers, design tokens and all styles |
| `50-shelf` | Shelf, generated covers, new-book dialog |
| `60-workbench` | Page model, app bar, directory, data loading, writing persistence |
| `70-views` | Overview, chapter views, tracking, export, the writing scene |
| `80-panel` | Right context panel and the compact sidebar workbench |
| `90-register` | DSH slot registration and exported helpers |

`dev/build-client.mjs` concatenates the fragments in order. `dev/test-bundle.mjs` verifies that `client.js` is exactly the build of the current fragments.

## Key state

- **Current book / view**: stored per book in `localStorage` (`nw.view:<bookKey>`), restored when the workbench mounts.
- **In-flight write**: `nw.write:<bookKey>` stores chapter, start time, baseline (mtime/words/hasText) and session id; a remount restores the writing scene and resumes the 4-second poll.
- **Writing session**: one per book, stored by the plugin; the app bar shows the live state and opens the session.
- **File editing**: `file` + `draft` + `editing`; switching objects or leaving with a dirty draft asks first.
- **Panels**: right context panel; in a session view the novel panel is a separate compact workbench with its own refresh loop.

## Testing

The tests run the real Client against an in-process Host API, using a small nested-component React runtime and a temporary copy of the sample book. There is no browser dependency.

```bash
npm run build
npm run check
npm test
```

The numbers and coverage are in [../README.md](../README.md#开发). The release checklist lives in [RELEASING.md](RELEASING.md); the internal test report is not part of the public package.
