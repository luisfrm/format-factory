# Auto-updates

The installed app checks for a new version once a day and offers to update
itself. Updates are signed, so the app only accepts packages that come from
this project.

## What the user sees

```
app starts
  └─ waits 10 s
       └─ checked in the last 24 h?  → skip
            └─ asks the endpoint
                 ├─ network error      → silence, no toast
                 ├─ same version       → nothing
                 └─ new version        → banner under the header
                      "v0.2.0 está disponible · Actualizar"
```

- **"Actualizar"** opens a dialog with the release notes, the download progress
  and the install.
- **×** hides the banner for 7 days (snooze).
- **"Omitir esta versión"** never offers that version again, but Settings still
  shows it.
- **Settings → Actualizaciones** has the current version, the last check and a
  manual *Buscar actualizaciones* button. If there is nothing, a toast says so.

Updates are **blocked while conversions are running**. The app replaces its own
binary, so the queue would die. The dialog explains it.

## Where the app looks

```json
// src-tauri/tauri.conf.json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/luisfrm/format-factory/releases/latest/download/latest.json"
    ],
    "pubkey": "…"
  }
}
```

`latest.json` is generated in the publish job and uploaded with the release:

```json
{
  "version": "0.1.3",
  "notes": "",
  "pub_date": "2026-10-31T00:02:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "…minisign signature…",
      "url": "https://github.com/…/Format-Factory_0.1.3_windows-x64-setup.exe"
    },
    "linux-x86_64": {
      "signature": "…",
      "url": "https://github.com/…/Format-Factory_0.1.3_linux-x64.AppImage"
    }
  }
}
```

On Windows the updater downloads the NSIS installer and runs it silently. On
Linux it replaces the AppImage file. Both then restart the app.

## Signing keys

The updater refuses any package whose signature does not match the public key
compiled into the app. That is what stops a stolen token from shipping malware.

| Key | Where |
|---|---|
| Public | `tauri.conf.json` → `plugins.updater.pubkey` |
| Private | GitHub secret `TAURI_SIGNING_PRIVATE_KEY` and a local file |

Generate them once:

```bash
pnpm tauri signer generate -w ~/.tauri/format-factory.key
```

**If the private key is lost, no further updates can ever be signed.** Keep it
in a password manager and in an offline copy. The app already installed on
users' machines will reject anything signed with a different key.

Local installer builds read the key from `.env` (see
[development.md](./development.md)).

## Which installs can update themselves

| Install | Auto-update | Why |
|---|---|---|
| Windows `.exe` (NSIS) | Yes | Per-user install, no admin rights needed |
| Linux AppImage | Yes | It replaces the file in place |
| Linux `.deb` | No | The package manager owns those files |
| Windows `.msi` | No | Per-machine install in Program Files; the updater would install a second copy |
| macOS `.dmg` | No | Unsigned apps can be blocked by Gatekeeper after replacement |

The app asks Rust how it was installed (`runtime_info` in `src-tauri/src/runtime.rs`)
and shows a download link instead of the update button when self-update is not
possible.

macOS is intentionally manual until the app is signed and notarized with an
Apple Developer certificate.

## State kept across an update

The process restarts, but nothing is lost:

- History and settings live in `localStorage`, which the installer does not
  touch.
- `useLastRoute` remembers the screen you were on.
- The queue is empty by design: updates are blocked while jobs run.

## Debugging

| Symptom | Check |
|---|---|
| Banner never appears | `latest.json` exists at `releases/latest/download/latest.json` |
| Banner appears but install fails | The `.sig` file matches the package, and the public key in `tauri.conf.json` is the one that signed it |
| Nothing happens in `pnpm dev` | Expected. The updater only runs in packaged builds. |
| «Al día» when a release exists | The release must be published, not draft, and `latest.json` must include your platform |

To test the whole flow you need two releases: install version N (with the
updater), then publish N+1. Installing a version that predates the updater will
never update itself.
