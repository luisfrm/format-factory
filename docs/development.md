# Development

## What you need

| Tool | Version | Pinned in |
|---|---|---|
| Node.js | 24.15.0 | `.node-version` |
| pnpm | 11.5.3 | `packageManager` in `package.json` |
| Rust | 1.98.1 | `rust-toolchain.toml` |
| FFmpeg / FFprobe | 6.1.1 | `src-tauri/binaries/` (not committed) |

Nothing floats. CI reads the same files, so your machine and the runner build
with the same versions.

## First run

```bash
pnpm install
pnpm setup:binaries   # copies ffmpeg + ffprobe from node_modules
pnpm dev
```

`setup:binaries` looks for the binaries inside the `ffmpeg-static` and
`ffprobe-static` dev dependencies and copies them to `src-tauri/binaries/` with
the name Tauri expects (`ffmpeg-<target-triple>.exe`). If it cannot find them,
it prints the manual steps for your OS.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Full app in a native window. Vite + Rust with reload. |
| `pnpm dev:web` | Frontend only, in the browser, with a fake backend. |
| `pnpm build` | Portable executable, no installer. |
| `pnpm build:installer` | Installers for the current OS (signed). |
| `pnpm check` | Typecheck + YAML lint + TS tests + Rust tests. |
| `pnpm test` | TS tests only. |
| `pnpm test:rust` | Rust tests only (includes a real conversion). |
| `pnpm lint:yaml` | Parses every workflow and template. |
| `pnpm release patch` | Publishes a new version (see [release.md](./release.md)). |
| `pnpm setup:binaries` | Re-provisions the FFmpeg sidecars. |

## Two ways to develop

**`pnpm dev`** runs the real thing: Tauri builds the Rust side, opens the
window and loads the Vite server. Rust changes recompile and restart the window
in a few seconds. React changes hot reload instantly.

**`pnpm dev:web`** runs only the frontend. `src/lib/backend.ts` switches to
`demoBackend`, so file picking uses an `<input type="file">`, probing reads the
browser `File` size, and conversions are simulated with timers. Everything else
— layout, animations, queue states, history — is exactly the same.

Use it to iterate on design without waiting for Rust. Do not use it to verify
that conversions work.

## The one thing that surprises everyone

`cargo test` compiles `lib.rs`, which calls `tauri::generate_context!()`. That
macro embeds `dist/`. If `dist/` does not exist, the build fails, even though
you only wanted to run tests.

So the order is always:

```bash
pnpm bundle
pnpm test:rust
```

CI does the same ([`build.yml`](../.github/workflows/build.yml)).

## Building installers locally

Signed installers need the private key:

```bash
cp .env.example .env
# edit .env and point TAURI_SIGNING_PRIVATE_KEY at your key file
pnpm build:installer
```

The Tauri CLI does **not** read `.env` by itself, so `scripts/build-app.mjs`
loads it and then calls the CLI. In CI the key comes from a GitHub secret, so
the same script works without changes.

`pnpm build` (no installer) does not sign anything, so it works without a key.

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `Port 1420 is already in use` | A dev server is still running | Kill it, or find it with `Get-NetTCPConnection -LocalPort 1420` |
| `ERR_PNPM_IGNORED_BUILDS` | pnpm blocks install scripts by default | `allowBuilds` in `pnpm-workspace.yaml` allows only `ffmpeg-static` |
| "A public key has been found, but no private key" | Building installers without a key | Add `.env` or set `TAURI_SIGNING_PRIVATE_KEY` |
| `generate_context!` fails | `dist/` missing | `pnpm bundle` first |
| App says "Motor no detectado" | No ffmpeg in `src-tauri/binaries/` | `pnpm setup:binaries` |

## Adding a dependency

1. Check that it is really needed. The UI already has Radix, CVA, Motion and
   Sonner.
2. Add it with pnpm.
3. If it has an install script, pnpm will block it. Decide explicitly whether
   to allow it in `pnpm-workspace.yaml`.
4. Run `pnpm check` and `pnpm build`.

This is on purpose: a new package cannot run code on your machine without you
saying so.
