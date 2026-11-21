# Releasing

The installable bundle is `novel-workbench/` and is published as `narracat-dsh-workbench` on npm. This repository is the source of that bundle.

## 1. Prepare

- Update `novel-workbench/package.json` version and `engines.dsh` if the DSH API requires it.
- Update `novel-workbench/CHANGELOG.md` with user-visible changes.
- Update `novel-workbench/README.md` and the repository README if features or compatibility changed.
- Keep `repository`, `bugs` and `homepage` in `novel-workbench/package.json` pointing at this repository and `https://narracat.com/dsh`.

## 2. Build and test

```bash
npm run build
npm run check
npm test
```

`test-bundle` must see `novel-workbench/client.js` in sync with `src/client/*.js`; commit the rebuilt file.

## 3. Pack

```bash
npm run pack:bundle
# -> dist/narracat-dsh-workbench-<version>.tgz
shasum -a 256 dist/narracat-dsh-workbench-<version>.tgz   # macOS
sha256sum dist/narracat-dsh-workbench-<version>.tgz        # Linux
```

Inspect the tarball (`tar -tzf`) and confirm it contains `package.json`, `LICENSE`, `NOTICE`, `CHANGELOG.md`, `docs/`, `skills/`, `locale/` and `icon.svg`.

## 4. Publish to npm

New packages and bypass-2FA tokens go through **staged publishing**:

```bash
cd dist
npm publish ./narracat-dsh-workbench-<version>.tgz --access public
```

A `202 Accepted` response plus a `0.0.0-stage` placeholder means the upload is accepted but not live. Approve it with 2FA:

```bash
npx npm@latest stage list
npx npm@latest stage approve <stage-id>
```

Or open the package page on npmjs.com and approve it in the **Staged Packages** tab. Wait for the malware scan if the Approve button is disabled. Once approved:

```bash
npm view narracat-dsh-workbench version dist-tags
```

`latest` must point at the new version. Deprecate the placeholder if it remains:

```bash
npm deprecate narracat-dsh-workbench@0.0.0-stage "Temporary placeholder; install <version> instead."
```

Do not use `npm publish` as a shortcut around approval; npm's account policy will reject or stage it.

## 5. GitHub release

Push a tag and create a GitHub Release with the packed tarball:

```bash
git tag v<version>
git push origin v<version>
```

The `release` workflow runs the tests, packs the bundle, and attaches `dist/*.tgz` to the release. Do not commit `dist/` to the repository.

## 6. Market index

The repository's `market/index.json` is a DSH custom plugin index generated from the npm registry. After a successful publish:

```bash
node market/update-index.mjs
```

It reads published versions, publish times and `dist-tags` from npm, keeps only versions with `dsh.bundle` and a valid `engines.dsh`, and writes only real versions (never `0.0.0-stage` or placeholder template versions). Deploy `market/index.json` and `market/icons/` together.

## 7. Post-release

- Verify a clean install in a temporary profile: `dsh plugin --profile release-check add narracat-dsh-workbench@<version>`.
- Verify the registry tarball SHA matches the local `dist/` file.
- Update the website's install/version block and, if hosted, the custom index URL.
- Announce only facts covered by the release notes; do not claim official endorsement.
