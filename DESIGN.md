---
name: Transmute
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#373940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#191b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a30'
  surface-container-highest: '#33343b'
  on-surface: '#e2e2eb'
  on-surface-variant: '#e3bdbf'
  inverse-surface: '#e2e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#aa888a'
  outline-variant: '#5b4041'
  surface-tint: '#ffb2b7'
  primary: '#ffb2b7'
  on-primary: '#67001b'
  primary-container: '#ff516a'
  on-primary-container: '#5b0017'
  inverse-primary: '#bc0b3b'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b7'
  on-primary-fixed: '#40000d'
  on-primary-fixed-variant: '#92002a'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#111319'
  on-background: '#e2e2eb'
  surface-variant: '#33343b'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  badge-format:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

The design system establishes a high-performance, studio-grade desktop utility environment built for speed, density, and precision. It draws direct inspiration from professional desktop engineering workflows, pairing the meticulous utility of modern pro-tools with the fluid micro-interactions of macOS native applications.

### Brand Personality & Emotional Core
- **Hyper-Efficient & Focused:** Zero visual fluff. Layouts prioritize spatial density, direct keyboard navigation, clear conversion pipelines, and transparent batch feedback.
- **Instrument-Grade Reliability:** The interface acts as a physical production rack. High-contrast telemetry, strict state indicators, and deterministic micro-interactions assure the user that large-scale operations are safe and predictable.
- **Tactile Modern Utility:** Deep charcoal layers paired with an electric crimson accent project high speed and focused power, balancing technical rigor with editorial polish.

### Style Synthesis
The visual language balances **refined desktop minimalism** with **tonal glassmorphic overlays** and **micro-border delineation**:
- Surfaces rely on dark slate tiers to separate stages (source queue, codec configuration inspector, output terminal).
- 1px hairline borders (`rgba(255, 255, 255, 0.08)`) outline containers without visual bulk.
- Translucent backdrop blurs (`backdrop-filter: blur(16px)`) are reserved for floating inspector HUDs, modals, and collapsed command palettes.

## Colors

The palette is tuned specifically for sustained low-light professional usage. Dark slate grounds the interface, preventing eye strain during extended batch tasks, while surgical pops of crimson highlight conversion triggers, primary actions, and destructive overrides.

### Palette Architecture
- **Primary (`#F43F5E` / `#E11D48`):** Crimson/Ruby accent. Reserved for primary conversion execution, active pipeline states, critical switches, and high-priority indicators.
- **Secondary (`#38BDF8`):** Precision Cyan. Used exclusively for stream metadata, codec readouts (AV1, HEVC, FLAC), and telemetry metrics (bitrate, FPS).
- **Tertiary (`#10B981`):** Emerald Success. Applied to completed encodes, verified checksums, and optimal parameter matches.
- **Neutral Canvas (`#0F1117`):** Primary base slate. Sets the deep canvas boundary.

### Functional Surface Tiers
- **Canvas Base:** `#0F1117` (Global app background, window framing).
- **Surface Tier 1:** `#181B22` (Side rail, queue master container, inspector background).
- **Surface Tier 2:** `#212631` (Interactive queue cards, active list items, input fields).
- **Surface Tier 3:** `#2B3240` (Hover states, active selection highlights, secondary action chips).

### Semantic & Border Tokens
- **Hairline Border Subdued:** `rgba(255, 255, 255, 0.06)`
- **Hairline Border Default:** `rgba(255, 255, 255, 0.10)`
- **Hairline Border Active / Focus:** `rgba(244, 63, 94, 0.60)`
- **Warning Indicator:** `#F59E0B` (Dropped frames, lossy compression alert).
- **Error Indicator:** `#EF4444` (Codec mismatch, corrupted stream).

## Typography

The type system separates textual interface controls from analytical machine metadata using two high-performance typefaces: **Inter** for clean readability across labels, panels, and UI elements; and **JetBrains Mono** for technical readouts, codec indicators, timecodes, and queue telemetry.

### Font Hierarchy & Roles
- **Primary Interface (Inter):** Leverages optical weight distribution (`400` for content, `600` for headers and section anchors). Tight letter-spacing ensures compact layout footprints suitable for multi-column queues.
- **Data & Telemetry (JetBrains Mono):** Drives all format badges (MKV, MP4, AAC, PDF), progress percentages, estimated time remaining, audio channel matrixing, and bitrates. Tabular numbers (`tnum`) must remain enabled across the entire platform to prevent layout shift during active batch encoding.

### Display Rules
- Transform format badges to full uppercase (`text-transform: uppercase`) with `badge-format`.
- Use `label-code-sm` for live-streaming log consoles and conversion speed multipliers (e.g., `4.8x`).
- Keep body prose at `13px` (`body-md`) as the default baseline to support high information density without sacrificing legibility.

## Layout & Spacing

The interface uses a multi-pane desktop structural grid with strict boundary pinning, designed for fluid expansion between narrow desktop configurations (`1024px`) and ultra-wide monitor workspaces (`2560px+`).

### Desktop Multi-Pane Architecture
1. **Collapsible Activity Rail (Left):**
   - Width: `56px` (collapsed icon-only mode) expanding to `220px` (nav labels + queue status counters).
   - Dedicated window controls, source workspace presets, and history archives.
2. **Batch Queue Master (Center / Primary):**
   - Fluid auto-width layout with fixed item heights (`64px` for single files, `96px` for multi-stream complex jobs).
   - Separated by `0.75rem` (`gutter`) vertical intervals.
3. **Inspector & Codec HUD (Right):**
   - Width: Fixed `360px` docked panel, collapsible into a slide-over modal when horizontal screen width falls below `1200px`.
   - Contains container muxing, video/audio tracks, subtitles, bitrate sliders, and destination targets.

### Rhythmic Density
- Component interiors enforce an **8px grid increment** (`space-sm: 0.5rem`, `space-md: 0.75rem`).
- Form elements, list items, and segment pickers share consistent vertical padding (`6px` to `8px`) to ensure instant touch/click target acquisition while maintaining tight desktop proportions.

## Elevation & Depth

Visual hierarchy does not rely on exaggerated drop shadows. Instead, it utilizes **tonal surface stacking**, **calibrated inner glows**, and **frosted backdrop blur** to denote z-index layers.

### Tonal Hierarchy
- **Level 0 (App Canvas):** Base background `#0F1117`. Flat, no borders.
- **Level 1 (Docked Containers & Split Panes):** Surface `#181B22` bounded by a 1px border `rgba(255, 255, 255, 0.06)`.
- **Level 2 (Interactive Queue Items & Cards):** Surface `#212631` with an interior top border highlight `inset 0 1px 0 rgba(255, 255, 255, 0.05)` and subtle perimeter border `rgba(255, 255, 255, 0.08)`.
- **Level 3 (Floating HUDs, Flyouts & Menus):** Surface `rgba(33, 38, 49, 0.85)` with `backdrop-filter: blur(16px)`, outer shadow `0 12px 32px rgba(0, 0, 0, 0.45)`, and border `rgba(255, 255, 255, 0.12)`.

### Active Accent Glow
When an encoding job is running or a container receives drag-and-drop focus:
- Outline switches to `#F43F5E` with an ambient glow of `0 0 16px rgba(244, 63, 94, 0.25)`.
- Progress bars utilize an intense foreground edge glow: `box-shadow: 0 0 8px #F43F5E`.

## Shapes

The interface adopts a **Soft (`1`)** shape metric (`0.25rem` / `4px` base radius), delivering a precise, industrial desktop appearance aligned with professional media tools.

### Curvature Tokens
- **Micro Elements (Format Badges, Checkboxes, Tooltips):** `4px` (`rounded-sm`). Sharp, legible, efficient with pixel grid alignments.
- **Standard Controls (Buttons, Text Inputs, Segment Selectors):** `6px` (`rounded-md`). Subtle softening while preserving crisp layout edges.
- **Structural Containers (Queue Cards, Inspector Sections):** `8px` (`rounded-lg`). Provides distinction between internal tools and enclosing containers.
- **Floating Modals & Drop Zones:** `10px` (`rounded-xl`). The maximum corner radius permitted within the system to maintain a professional, technical aesthetic.

## Components

### Buttons
- **Primary Action (Convert / Start Queue):** Solid crimson background `#F43F5E` text `#FFFFFF`, font weight `600`, micro-bevel top highlight `inset 0 1px 0 rgba(255, 255, 255, 0.2)`. On hover: `#E11D48`. On active click: scale `0.985`.
- **Secondary Action (Add Files, Pause):** Surface `#212631` with `rgba(255, 255, 255, 0.10)` border. Text `#FFFFFF`. Hover: `#2B3240`.
- **Icon Utility Buttons:** Transparent surface, `32x32px` square, border-radius `6px`. Hover: `rgba(255, 255, 255, 0.08)`.

### Format Badges & Codec Chips
- **Container Structure:** Padding `2px 6px`, border-radius `4px`, font `JetBrains Mono` at `10px` bold.
- **Video Badges (MKV, MP4, MOV, WEBM):** `rgba(244, 63, 94, 0.12)` background, `#F43F5E` text, `rgba(244, 63, 94, 0.3)` border.
- **Audio Badges (FLAC, AAC, MP3, WAV):** `rgba(56, 189, 248, 0.12)` background, `#38BDF8` text, `rgba(56, 189, 248, 0.3)` border.
- **Document Badges (PDF, EPUB, MOBI):** `rgba(245, 158, 11, 0.12)` background, `#F59E0B` text, `rgba(245, 158, 11, 0.3)` border.

### Queue Cards & Conversion Lists
- Each queue row is a self-contained card on `#181B22` with a `1px` border of `rgba(255, 255, 255, 0.06)`.
- **Left Slot:** Format badge and file representation icon, followed by primary file name (`Inter 13px weight 600`) and original stream telemetry (`JetBrains Mono 11px`).
- **Center Slot:** Directional arrow (`→`) into the selected destination profile badge, accompanied by target codec parameters.
- **Right Slot:** Real-time processing status (Progress bar, current bitrate, ETA, quick actions: pause, inspect, remove).

### Progress Indicators
- **Track:** Height `4px`, surface `#181B22`, inner border-radius `2px`.
- **Indicator Fill:** Solid `#F43F5E` with leading linear glow. Completed items transition cleanly to `#10B981`.

### Inputs & Inspector Sliders
- **Text & Numeric Inputs:** Background `#0F1117`, border `1px solid rgba(255, 255, 255, 0.12)`, font `Inter 13px`. Focus state triggers border `#F43F5E` with box-shadow `0 0 0 1px #F43F5E`.
- **CRF / Bitrate Range Sliders:** Minimal `2px` horizontal rail (`rgba(255, 255, 255, 0.15)`) with a `14px` solid crimson thumb, featuring a centered white dot indicator.

### Status Indicators
- **Pulsing Dot Matrix:** 6px circular indicator.
  - *Active Encoding:* `#F43F5E` with CSS ping animation.
  - *Ready / Paused:* `#F59E0B` static.
  - *Finished:* `#10B981` static.
  - *Failed:* `#EF4444` static.