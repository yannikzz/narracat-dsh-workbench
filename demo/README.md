# 雨港来信 — the sample book

This directory is a fictional `.narracat` book used by the tests, previews and screenshots. It is not a real person's manuscript.

- `demo/雨港来信/.narracat/config.yaml` marks it as a book.
- Chapters 1–3 have published prose; chapter 4 is intentionally **not written** so the tests can exercise the next-step path and the writing wait state.
- `tracking/` contains generated sheets; the memo is the only hand-editable file.
- `dev/test-*.mjs` copy this directory into a temporary workspace and apply their own mutations. Do not "fix" the sample by writing chapter 4: `test-ui` removes any chapter 4 manuscript/memory in its temporary copy, and the next-step tests expect it to be unwritten.

If you need a different book for a manual check, put it in a DSH workspace; do not commit real books here.
