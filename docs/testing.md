# Testing

Two test suites, one rule: every claim in the README should have something that
proves it.

```bash
pnpm test        # 106 tests, Vitest + Testing Library
pnpm test:rust   # 16 tests, cargo
pnpm check       # typecheck + YAML lint + both suites
```

## TypeScript tests

They cover the pure logic and a few components.

| File | What it proves |
|---|---|
| `lib/files.test.ts` | Path splitting, extensions, output names, human sizes, durations |
| `lib/formats.test.ts` | Format catalog is consistent; audio sources cannot become video |
| `lib/jobs.test.ts` | Progress merging, queue counts, ordering, ETA |
| `lib/batch.test.ts` | Batch summaries: ready, running, done, failed |
| `lib/update-policy.test.ts` | When to check and when to bother the user |
| `components/ui/segmented-control.test.tsx` | Radio group semantics and keyboard behaviour |
| `store/converter-store.test.ts` | Staging rules and target constraints |

The tests run in jsdom with Testing Library. Globals are off, so every file
imports `describe`/`it` explicitly and `src/test/setup.ts` registers cleanup.

## Rust tests

| Area | What it proves |
|---|---|
| `plan.rs` | Each target produces the right ffmpeg arguments (codecs, CRF, bitrate, faststart) |
| `plan.rs` | **Real conversion**: runs ffmpeg on `files-mock/video1.mp4` and checks the output exists |
| `media.rs` | Extension detection and fallback when a file is missing |
| `media.rs` | **Real probe**: reads the fixture and checks dimensions, codecs, duration |
| `queue.rs` | Progress clamping, ETA maths, error extraction |

The two "real" tests skip themselves if the sidecar binaries are missing, so the
suite still runs on a clean clone. In CI the sidecars are always provisioned, so
they always execute.

## Test media

`files-mock/` contains three synthetic files. They are generated, not recorded:

| File | Contents |
|---|---|
| `video1.mp4` | `testsrc2` pattern, 480×480, 14 s, with a 440 Hz tone |
| `audio1.mp3` | 220 Hz sine, 20 s |
| `audio2.m4a` | 330 Hz sine, 15 s |

Regenerate them with the bundled ffmpeg:

```bash
FF=src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe   # adjust for your OS

"$FF" -y -f lavfi -i "testsrc2=size=480x480:rate=30:duration=14" \
      -f lavfi -i "sine=frequency=440:duration=14" \
      -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart \
      files-mock/video1.mp4

"$FF" -y -f lavfi -i "sine=frequency=220:duration=20" \
      -c:a libmp3lame -b:a 192k files-mock/audio1.mp3

"$FF" -y -f lavfi -i "sine=frequency=330:duration=15" \
      -c:a aac -b:a 128k files-mock/audio2.m4a
```

### Why synthetic media

The first version of this repo used a downloaded video and two commercial songs
as fixtures. They were committed, and the repository is public. That is a
copyright problem and, in the case of the video, a privacy problem: it showed a
real person.

Rules from now on:

- Never commit media you did not create or license.
- Fixtures must be generated with `lavfi` (test patterns and tones).
- If a test needs a specific property, generate it — do not download it.

If real-world media is ever needed, keep it outside the repository and load it
from a local path guarded by an environment variable.

## What CI runs

Every pull request and every push to `master`:

1. `pnpm bundle` — required before Rust compiles
2. `pnpm test`
3. `pnpm test:rust`
4. `pnpm tauri build` for the OS of that runner

Docs-only changes are skipped (`paths-ignore`), except that CodeQL still runs on
its schedule.

## What is not covered

- **End-to-end inside the Tauri window.** There is no automated test that clicks
  the real app. The UI is tested in a browser with the demo backend, and the
  engine is tested in Rust. The gap between them is covered by manual testing
  before a release.
- **Real platform installers.** CI builds them but does not install them.

These are known gaps, not oversights.

## Adding a test

1. Pure logic goes next to the file: `foo.ts` → `foo.test.ts`.
2. Components use Testing Library with `@testing-library/jest-dom/vitest`.
3. Rust tests live in a `#[cfg(test)] mod tests` at the bottom of the module.
4. Run `pnpm check` before pushing.
