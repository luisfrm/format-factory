# Architecture

Format Factory is one desktop app. Inside, it is two programs that talk to each
other:

- **Rust** — owns the window, the file system, FFmpeg and the job queue.
- **React** — runs inside a WebView and draws the interface.

There is no Node.js at runtime. The web code cannot read files or start
processes. Everything that touches the machine goes through Rust.

```
┌──────────────────────── the app (one .exe) ────────────────────────┐
│                                                                    │
│   Rust process                      WebView (Chromium)            │
│   ├─ window, lifecycle        ◄──►  React 19 + Tailwind           │
│   ├─ JobManager (queue)             Zustand stores                │
│   ├─ ffmpeg / ffprobe               components                    │
│   └─ commands ◄──── IPC ────►       invoke() / listen()           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Repository layout

```
format-factory/
├─ src/                  the web app
├─ src-tauri/            the Rust app
├─ scripts/              build and release helpers (plain Node)
├─ docs/                 this folder
├─ files-mock/           synthetic test media
└─ .github/              workflows, templates, CODEOWNERS
```

### `src/` — the web app

| Folder | What lives there | Rule |
|---|---|---|
| `app/` | Router, layout, navigation, route restore | Wiring only, no business logic |
| `components/ui/` | Small reusable pieces: Button, Badge, Progress, Tooltip | No app concepts |
| `components/conversion/` | Drop zone, file rows, queue, target picker | Knows about files, not about pages |
| `components/update/` | Update banner, dialog, watcher | Self-contained |
| `features/` | One folder per screen: home, queue, history, settings | A feature never imports another feature |
| `lib/` | Pure logic: formats, files, jobs, batch, policies | No React |
| `store/` | Zustand stores (UI state, queue, updates) | No JSX |
| `styles/` | Design tokens and global CSS | Single source for color and motion |

Dependency direction is one way: `features → components → lib`.
If two features need the same thing, it moves up to `components/` or `lib/`.

### `src-tauri/src/` — the Rust app

| File | Responsibility |
|---|---|
| `lib.rs` | Builds the app: plugins, managed state, command list |
| `engines.rs` | Finds ffmpeg/ffprobe and reports versions |
| `media.rs` | Runs ffprobe and turns the JSON into `MediaInfo` |
| `plan.rs` | Turns a job spec into ffmpeg arguments |
| `queue.rs` | Runs jobs one at a time and emits progress events |
| `runtime.rs` | Tells the UI how the app was installed |

## The bridge: `src/lib/backend.ts`

The UI never imports `@tauri-apps/api` directly. It talks to one interface:

```ts
interface Backend {
  engines(): Promise<EngineStatus[]>;
  pickMediaFiles(kind?): Promise<string[]>;
  probe(paths: string[]): Promise<ProbeResult[]>;
  startJob(spec: JobSpec): Promise<void>;
  cancelJob(id: string): Promise<void>;
  onJobUpdate(cb): () => void;
}
```

There are two implementations:

- `nativeBackend` — used inside Tauri. Calls `invoke()` and `listen()`.
- `demoBackend` — used in a normal browser. Fakes the queue with timers.

That split is why `pnpm dev:web` can run the whole UI without Rust. It is also
what makes UI testing possible.

## How a conversion flows

1. The user drops a file. The UI calls `backend.pickMediaFiles()` or receives
   real paths from the Tauri drag event.
2. `backend.probe(paths)` runs ffprobe **in Rust** and returns size, duration,
   codecs and dimensions.
3. The file sits in the staging list, with a target format per row.
4. Pressing Convert builds jobs and calls `backend.startJob(spec)` once per job.
5. Rust pushes the spec into a channel. A worker thread picks it up.
6. The worker builds the ffmpeg arguments and runs it with `-progress pipe:1`.
7. Every ~140 ms it parses `out_time_us`, `fps` and `speed`, computes a
   percentage against the real duration, and emits a `job-event`.
8. The UI updates the row from that event. No polling.

Cancelling kills the process tree and marks the job as canceled.

## State

| Where | What | Survives a restart |
|---|---|---|
| Rust memory | Running queue, child process IDs | No |
| `localStorage: ff.queue` | Finished jobs (history) | Yes |
| `localStorage: ff.ui` | Sidebar state | Yes |
| `localStorage: ff.updates` | Last check, snooze, skipped version | Yes |
| `localStorage: ff.lastRoute` | Last screen | Yes |

A running conversion does not survive a restart. The binary is replaced during
an update, so the app blocks updates while jobs are active.

## Where do I put things?

| I want to… | Where |
|---|---|
| Add a screen | `src/features/<name>/`, plus a route in `app/routes.tsx` and an item in `app/navigation.ts` |
| Make the OS do something new | A `#[tauri::command]` in Rust, registered in `lib.rs`, plus a method in the `Backend` interface |
| Add a format | `src/lib/formats.ts` and a branch in `src-tauri/src/plan.rs` |
| Change a color | `src/styles/globals.css` (`@theme` block) |
| Add an event from Rust | `app.emit("name", payload)` and `listen()` in a store |
| Add a script | `scripts/*.mjs`, plain Node, no dependencies |
