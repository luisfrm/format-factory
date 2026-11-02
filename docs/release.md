# Release

A release is one command. This document explains what that command does, what
CI does after it, and what to do when something goes wrong.

## The rule

The version lives in `package.json`. Nothing else.

`tauri.conf.json` points to it (`"version": "../package.json"`), so the app
binary, the MSI and the DMG all carry the same number. `Cargo.toml` is synced
from it by a script.

When the version changes and you push to `master`, CI publishes a release.
When it does not change, CI builds everything and publishes nothing.

## Publishing

```bash
git checkout master
git pull
pnpm release patch     # 0.1.3 → 0.1.4
```

`scripts/release.mjs` refuses to run unless:

- you are on `master`,
- there are no uncommitted tracked files,
- your `master` is not behind `origin/master`.

That guard exists because the script pushes **straight to master**. Publishing
from a feature branch would drag unmerged commits into the main branch. Use
`--no-push` if you only want the commit.

Then it bumps `package.json`, syncs `Cargo.toml`, commits
`chore(release): vX.Y.Z` and pushes.

## What CI does

[`build.yml`](../.github/workflows/build.yml) runs four jobs.

```
version            reads package.json, asks GitHub if vX.Y.Z exists
   │
   ├── audit        pnpm audit, informational only
   │
   └── build ×3     Windows · Linux · macOS, in parallel
          │            install → sidecars → frontend → tests → package
          │            normalize names → upload artifact
          ▼
       publish       only if the version is new
                     download all → INSTALL.md → latest.json → SHA256SUMS
                     → attest provenance → create draft → upload → publish
```

Each build runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm setup:binaries` — the sidecars for that OS
3. `pnpm bundle` — needed before any Rust compilation
4. `pnpm test` and `pnpm test:rust`
5. `pnpm tauri build --bundles …` with the signing key
6. `collect-artifacts.mjs` — normalizes names and collects updater packages

Because each OS builds on its own runner, a failing platform does not cancel
the others (`fail-fast: false`). You see all three results.

## Why a separate `version` job

If the three builds each tried to create the release, they would race. One job
decides, three build, one publishes. It also means a push without a version
change builds and verifies but touches nothing.

## Artifact names

Tauri names files differently per OS. `collect-artifacts.mjs` normalizes them:

```
Format-Factory_0.1.4_windows-x64-setup.exe
Format-Factory_0.1.4_windows-x64.msi
Format-Factory_0.1.4_macos-arm64.dmg
Format-Factory_0.1.4_linux-x64.AppImage
Format-Factory_0.1.4_linux-amd64.deb
INSTALL.md
SHA256SUMS.txt
latest.json
```

`latest.json` is what the auto-updater reads. See
[auto-updates.md](./auto-updates.md).

## Signing and immutable releases

Every updater package is signed with minisign. The public key is in
`tauri.conf.json`; the private key is the `TAURI_SIGNING_PRIVATE_KEY` secret.

Releases are **immutable**. Once published, you cannot add, replace or delete
assets. That is why the pipeline creates a **draft**, uploads everything, and
only then publishes. A published release is a promise to whoever downloaded it.

The practical consequence: **you cannot patch a release**. If a build is bad,
publish a new version.

## Build-only runs

A push that does not change the version still runs the matrix. The `version`
job sees that `vX.Y.Z` already exists and sets `publish=false`. You get green
checks and no release.

This is the normal case for feature merges.

## Re-running by hand

Actions → **Release** → *Run workflow*.

- `force = false`: same as a normal push.
- `force = true`: completes a release that was left as a draft (for example,
  the upload failed halfway).

It will not overwrite a published release. If the release is already public, the
job stops with a clear message and tells you to bump the version.

## When something goes wrong

| Problem | What to do |
|---|---|
| One platform fails | Fix it and push again. The version does not change, so nothing is published. |
| The publish job fails after the draft was created | Re-run with `force = true` |
| A bad build reached users | Publish a patch. Releases are immutable; there is no rollback. |
| You need to redo the same version | You cannot. Bump the patch version. |
| Signing key missing | The build fails before packaging. Set the secret. |

## Checklist before publishing

- [ ] `pnpm check` passes locally
- [ ] The PR is merged and `master` is green
- [ ] You are on `master` and up to date
- [ ] The version bump matches what you intend (`patch`, `minor`, `major`)
- [ ] Nothing sensitive is staged (`git status`)
