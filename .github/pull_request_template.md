## Summary

<!-- What changed and why. Link any issue. -->

## Test plan

- [ ] `npm run build` (if Client fragments changed)
- [ ] `npm run check`
- [ ] `npm test`
- [ ] Manual DSH check in a temporary profile (if UI behavior changed)

## UI / screenshots

<!-- Use the sample book (demo/雨港来信), never a real manuscript. Light and dark if relevant. -->

## Checklist

- [ ] `novel-workbench/client.js` is rebuilt from `src/client/*.js` and committed.
- [ ] No `dist/`, generated previews, private books, secrets or personal paths are included.
- [ ] User-visible behavior is recorded in `novel-workbench/CHANGELOG.md`.
- [ ] This does not add a second write/next-step CTA to the same screen.
