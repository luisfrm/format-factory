# Format Factory

Conversor de archivos de escritorio: video, audio y lotes mixtos. FFmpeg hace el trabajo, la app lo hace fácil.

**Tauri 2** (shell nativo Rust) · **React 19 + TypeScript** · **Tailwind v4** · **FFmpeg 6.1**

---

## Requisitos

| Herramienta | Versión | Estado |
|---|---|---|
| Node.js | ≥ 20 | ✅ 24.15 |
| pnpm | ≥ 9 | ✅ 11.5 |
| Rust + cargo | ≥ 1.90 | ✅ 1.98 |
| FFmpeg / FFprobe | 6+ | ✅ sidecars en `src-tauri/binaries/` |

Los binarios **no están versionados** (pesan ~145 MB). `pnpm setup:binaries` los
copia desde las dependencias de desarrollo (`ffmpeg-static` / `ffprobe-static`)
con el nombre y el target triple que Tauri espera. Si algo falla, imprime las
instrucciones manuales para tu sistema.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | App completa en ventana nativa (Tauri + Vite, hot reload) |
| `pnpm dev:web` | Solo frontend en el navegador, con backend simulado |
| `pnpm build` | **Ejecutable** en `src-tauri/target/release/format-factory.exe` |
| `pnpm build:installer` | Instaladores `.msi` + `.exe` (NSIS) en `target/release/bundle/` |
| `pnpm check` | Typecheck + tests TS + tests Rust |
| `pnpm test` | 67 tests unitarios (Vitest + Testing Library) |
| `pnpm test:rust` | 16 tests de Rust (incluye una conversión real) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm bundle` | Solo el bundle del frontend (lo usa Tauri al compilar) |
| `pnpm typecheck` | Solo TypeScript |
| `pnpm setup:binaries` | Verifica los sidecars de FFmpeg |

`build` y `build:installer` provisionan los sidecars automáticamente desde
`node_modules` (ffmpeg-static / ffprobe-static) y **fallan con instrucciones
claras** si no hay binarios, para no distribuir un ejecutable que no puede convertir.

### Dónde queda cada cosa

| Comando | Windows | macOS | Linux |
|---|---|---|---|
| `pnpm build` | `src-tauri/target/release/format-factory.exe` | `src-tauri/target/release/format-factory` | `src-tauri/target/release/format-factory` |
| `pnpm build:installer` | `bundle/msi/*.msi` · `bundle/nsis/*-setup.exe` | `bundle/dmg/*.dmg` | `bundle/deb/*.deb` · `bundle/appimage/*.AppImage` |

**Tauri no compila para otros sistemas.** Cada `pnpm build:installer` produce
solo los artefactos del sistema donde corre: en Windows no vas a encontrar el
`.dmg` ni el `.AppImage`. Para tener los tres hay que compilar en cada sistema —
el workflow [`.github/workflows/build.yml`](.github/workflows/build.yml) hace
exactamente eso en paralelo y sube los artefactos como descarga.

> En `pnpm dev:web` el navegador no puede leer rutas reales ni lanzar procesos, así que
> `src/lib/backend.ts` sustituye el motor por una cola simulada. Toda la UI,
> transiciones y estados son los mismos; solo cambia quién convierte.

---

## Estructura

```
src/
├─ app/                     Composición: router, layout, navegación
├─ components/
│  ├─ ui/                   Primitivas sin dominio (18)
│  └─ conversion/           Piezas del flujo de conversión
├─ features/                Una carpeta por pantalla
│  ├─ home/                 Conversor (dropzone + staging + presets + cola)
│  ├─ queue/                Monitor de trabajos
│  ├─ history/              Registro persistente
│  ├─ settings/             Motores y preferencias
│  └─ engines/              Hook de estado de binarios
├─ lib/
│  ├─ formats.ts            Catálogo de formatos y presets (fuente única)
│  ├─ files.ts              Rutas, extensiones, tamaños, duraciones
│  ├─ jobs.ts               Modelo de trabajo, progreso, agregados
│  ├─ backend.ts            Contrato + implementación nativa y demo
│  └─ cn.ts
├─ store/
│  ├─ converter-store.ts    Archivos en espera y calidad
│  ├─ queue-store.ts        Cola + historial persistido
│  └─ app-store.ts          Preferencias de UI
├─ styles/globals.css       Tokens, keyframes y utilidades
└─ test/setup.ts

src-tauri/src/
├─ engines.rs               Localización de binarios y versiones
├─ media.rs                 ffprobe → MediaInfo
├─ plan.rs                  Construcción de argumentos ffmpeg
├─ queue.rs                 Cola serial + eventos de progreso
└─ lib.rs                   Builder de Tauri
```

**Regla de dependencias:** `features → components → lib`. Ninguna feature importa de otra.

---

## Cómo funciona una conversión

```
UI  ──►  backend.ts  ──invoke──►  Rust
                                  ├─ probe_files      ffprobe -show_streams
                                  ├─ enqueue_job  ──► cola serial (1 proceso)
                                  └─ emit "job-event" (progress, speed, ETA)
UI  ◄──  listen("job-event")  ◄──┘
```

- **Progreso real**: ffmpeg corre con `-progress pipe:1`; Rust parsea `out_time_us`,
  `fps` y `speed`, calcula el porcentaje contra la duración de ffprobe y emite
  eventos cada ~140 ms. No hay barras falsas.
- **Cola serial**: un solo proceso ffmpeg a la vez para no saturar la máquina.
  El resto espera en orden FIFO.
- **Cancelar**: se mata el árbol de procesos (`taskkill /T /F` en Windows) y el
  trabajo queda marcado como cancelado.
- **Sin sobreescribir**: si el destino coincide con el origen, se añade `-convertido`.

---

## Diseño

Tokens en `src/styles/globals.css` (`@theme` de Tailwind v4). Base oscura
`#0F1117`, acento crimson `#F43F5E`, cyan `#38BDF8` para telemetría, radios
4/6/8/10 px, Inter + JetBrains Mono empaquetadas con `@fontsource`.

Movimiento con una regla: **toda transición es reversible**. Entradas 200 ms
`cubic-bezier(.2,.8,.2,1)`, salidas 150 ms `cubic-bezier(.4,0,1,1)`, layout con
muelles `spring(380, 34)`. Todo desactivado con `prefers-reduced-motion`.

Detalle del sistema en [`DESIGN.md`](./DESIGN.md).

---

## Estado

- [x] Shell: sidebar colapsable, header, 4 rutas
- [x] Primitivas de UI con estados de foco y teclado
- [x] Conversor: dropzone nativo, lote multiarchivo con estado en vivo por fila
- [x] Lote: aplicar un destino a todos, añadir más al lote sin perder lo completado
- [x] Historial persistido con ahorro de tamaño
- [x] Ajustes: motores, carpeta de salida, calidad
- [x] 67 tests TS + 14 tests Rust
- [ ] Reordenar prioridad en la cola
- [ ] Presets personalizados
- [ ] Documentos (PDF → EPUB) con Calibre
