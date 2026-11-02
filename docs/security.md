# Security

This is a public repository that ships executable files. Two things matter:
nobody should be able to publish in our name, and nobody should be able to run
code in our CI with any privilege.

## The model

- The web UI has no access to the file system. All I/O goes through Rust
  commands registered in `src-tauri/src/lib.rs`.
- Tauri permissions live in `src-tauri/capabilities/default.json` and are kept
  to the minimum (`dialog`, `opener`, `updater`, `process`).
- No secrets are in the repository. Ever.
- Pull requests from forks run with a read-only token and no secrets.

## CI permissions

The release workflow starts with read-only access and only the publish job can
write:

```yaml
permissions:
  contents: read          # default for every job
...
publish:
  permissions:
    contents: write       # only here
    id-token: write       # provenance attestation
    attestations: write
```

If a new step needs more, it must be justified. Most do not.

## `pull_request` vs `pull_request_target`

We use `pull_request` everywhere, because it runs the PR code with a read-only
token. `pull_request_target` gives a write token and secrets to code you did not
review.

The one exception is [`greetings.yml`](../.github/workflows/greetings.yml),
which uses `pull_request_target` so it can post a welcome comment on a fork PR.
It is safe there because it never checks out the PR code and never runs it — it
only reads metadata and posts a comment. That exception is written in the file
so nobody "fixes" it later.

## Actions are pinned to a commit

Every `uses:` in this repo points to a full 40-character SHA, not a tag. A moved
tag cannot inject code into a build.

The repository setting enforces it (`sha_pinning_required`). Dependabot updates
the SHAs weekly; if a PR uses `@v4` instead, the run fails immediately.

## Install scripts are allow-listed

pnpm blocks every `postinstall` by default. Only one package may run code at
install time:

```yaml
# pnpm-workspace.yaml
allowBuilds:
  ffmpeg-static: true
```

Adding a dependency with an install script does nothing until someone adds it
here on purpose.

## Repository protections

| Control | Value |
|---|---|
| Pull request required for `master` | Yes |
| Approvals required | 1, from the code owner |
| Stale approvals dismissed on new commits | Yes |
| Required checks | Resolve version, Windows x64, Linux x64, macOS arm64, Review dependencies |
| Conversation must be resolved | Yes |
| Force push / branch deletion | Blocked |
| Admin bypass | Allowed (the owner can still push) |
| Tag ruleset `v*` | Cannot be deleted, moved or force-updated |
| Immutable releases | On |

## Automated scanning

| Tool | What it does |
|---|---|
| CodeQL | Static analysis for JS/TS and Rust, on `master` and weekly |
| Dependency review | Blocks PRs that add a dependency with a high severity advisory |
| Dependabot alerts + security updates | Watches installed dependencies |
| Secret scanning + push protection | Rejects a push that contains a token |
| Private vulnerability reporting | Gives researchers a private channel |
| Provenance attestation | Ties each release asset to the run that built it |

CodeQL does not run on pull requests on purpose: fork PRs get a read-only token
and cannot upload results, which would show a red check for every contributor.

## Release signing

Updates are signed with minisign. The private key lives in
`TAURI_SIGNING_PRIVATE_KEY` and in a local file that must be backed up. If it is
lost, no further updates can be signed and every installed app will reject new
versions.

## If a secret leaks

1. **Rotate it first.** Assume it is public. Revoke the token, regenerate the
   key, change the password.
2. Remove it from the code and push.
3. Remove it from history — see [history-rewrite.md](./history-rewrite.md).
4. If it was a GitHub token, check the audit log for use.
5. If it was the signing key, publish a new key only if you control the app
   distribution channel; otherwise users must reinstall manually.

Rotating is the part that matters. Deleting the commit is not enough.

## Reporting a vulnerability

Do not open a public issue. Use the private advisory form:
<https://github.com/luisfrm/format-factory/security/advisories/new>

See [`SECURITY.md`](../SECURITY.md) for scope and response times.
