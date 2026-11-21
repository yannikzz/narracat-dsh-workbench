# Contributing to Narracat · 叙述猫

Thanks for helping. This repository contains the installable DSH bundle in `novel-workbench/`, its tests in `dev/`, the fictional sample book in `demo/雨港来信/`, and product docs in `docs/`.

## Before you start

- Node.js 20 or newer.
- DSH `>=0.2.2-rc.5 <0.3.0` if you want to try the UI in a real DSH profile.
- No `npm install` is required for the repository tests; they use Node built-ins and local files only.

## Run the checks

```bash
npm run build     # rebuild novel-workbench/client.js from src/client/*.js
npm run check     # syntax-check Host / Agent / Client
npm test          # all 8 regression suites
npm run pack:bundle
```

The tests copy `demo/雨港来信` into a temporary directory. Do not point tests at a real book; do not commit real books, exports, or personal paths.

## Client changes

`novel-workbench/client.js` is generated from `novel-workbench/src/client/*.js` by `dev/build-client.mjs`.

- Edit the fragments in `novel-workbench/src/client/`.
- Run `npm run build`.
- Commit both the fragments and the rebuilt `client.js`.
- `dev/test-bundle.mjs` fails when the generated file is out of sync.

## UI changes

- Attach a screenshot made with the sample book, in light and dark mode where relevant.
- Keep the plugin's visual language: book content in the serif face, tool chrome in the host sans face, host theme tokens only, one primary action per screen.
- Don't add a second write CTA or a second next-step entry point.
- Keep narrow layouts usable: the view switch stays a tab bar and wraps/scrolls instead of becoming a select.

## Commit and PR

- Keep changes focused; separate unrelated refactors.
- Update `novel-workbench/CHANGELOG.md` for user-visible behavior.
- Describe the test plan in the PR: `npm test`, plus any manual DSH check and the profile used.
- Do not commit `dist/`, generated previews, `.DS_Store`, or secrets.
- Be kind; see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Release

Maintainers: see [docs/RELEASING.md](docs/RELEASING.md). npm publishes go through staged publishing and a maintainer 2FA approval; GitHub Releases attach the packed tarball.

## License

By contributing, you agree that your contribution is licensed under the MIT license (see [LICENSE](LICENSE)).
