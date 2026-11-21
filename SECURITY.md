# Security

## Supported versions

The latest `1.0.x` release receives security fixes. The plugin is a DSH bundle; the Host and Agent halves run locally under DSH, and the Client half runs in the DSH Web UI.

## Report a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

https://github.com/yannikzz/narracat-dsh-workbench/security/advisories/new

Include:

- the affected version (`narracat-dsh-workbench@x.y.z`),
- the DSH version and install method (GUI / CLI / agent),
- a minimal reproduction or a clear description,
- the impact (including whether real manuscripts or files could be affected).

Do not include a real manuscript, an API key, an npm token, or other secrets in the report. If you need to share a file, replace the content with a minimal fictional sample.

## Scope

In scope:

- path traversal / symlink escape / case-fold bypass around the book directory,
- writes to protected `.narracat` paths,
- authority or permission bypass in the Host API,
- publishing a draft to the wrong chapter or deleting a published chapter,
- credential or token leakage from the plugin,
- XSS or unsafe HTML rendering in the workbench.

Out of scope:

- the security of the model provider or the DSH runtime itself (report those to DeepSeek / DSH),
- prompt-injection-only issues without a concrete file or permission impact,
- issues that require a malicious local user with write access to the book directory,
- the fictional sample book content.

## Data handling

The plugin does not create a cloud copy of a book. Books are read and written as local `.narracat` directories. When the Agent drafts, DSH sends the necessary context to the model provider configured by the user. Exports are written locally. See the README and `novel-workbench/docs/GUIDE.md` for details.
