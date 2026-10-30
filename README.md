# Format Factory

Aplicación de escritorio para convertir archivos: video, audio y (más adelante) documentos.

Construida con **Tauri 2** (shell nativo en Rust) + **React 19 + TypeScript** (interfaz) + **FFmpeg** (motor de conversión).

---

## Requisitos

| Herramienta | Versión | Estado en este equipo |
|---|---|---|
| Node.js | ≥ 20 | ✅ 24.15 |
| pnpm | ≥ 9 | ✅ 11.5 |
| Rust + cargo | ≥ 1.90 | ✅ 1.98 |
| WebView2 | — | incluido en Windows 11 |
| FFmpeg / FFprobe | 6+ | ❌ pendiente (`pnpm setup:binaries`) |

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Solo el frontend en el navegador (`http://localhost:1420`) |
| `pnpm app:dev` | La app completa en una ventana nativa (Tauri + Vite) |
| `pnpm build` | Typecheck + bundle de producción del frontend |
| `pnpm app:build` | Instalador final (`.msi` / `.exe`) |
| `pnpm typecheck` | Solo TypeScript |
| `pnpm setup:binaries` | Verifica los sidecars de FFmpeg y dice qué falta |

> `pnpm dev` sirve para iterar el diseño rápido. Todo lo que dependa de Rust
> (motor, cola, historial) solo funciona con `pnpm app:dev`.

---

## Estructura

```
format-factory/
├─ index.html                  ← punto de entrada del webview
├─ vite.config.ts              ← Vite + Tailwind + alias @/ → src/
├─ tsconfig.json
├─ DESIGN.md                   ← sistema de diseño (tokens, tipografía, componentes)
├─ mock2.html                  ← referencia visual del layout de 3 paneles
│
├─ public/                     ← assets estáticos (favicon)
│
├─ src/                        ← FRONTEND (React + TS)
│  ├─ main.tsx                 ├─ bootstrap de React
│  ├─ app/                     ← composición de la app
│  │  ├─ App.tsx               │  HashRouter
│  │  ├─ routes.tsx            │  tabla de rutas
│  │  ├─ AppLayout.tsx         │  sidebar + topbar + <Outlet/>
│  │  └─ navigation.ts         │  fuente única de los ítems del menú
│  ├─ components/
│  │  ├─ layout/               │  Sidebar, Topbar, EngineStatusCard
│  │  ├─ ui/                   │  primitivas reutilizables (botones, inputs…)
│  │  └─ PagePlaceholder.tsx
│  ├─ features/                ← una carpeta por dominio funcional
│  │  ├─ home/                 │  drop zone, acciones rápidas, matriz
│  │  ├─ convert/              │  flujo de conversión individual
│  │  ├─ queue/                │  trabajos activos
│  │  ├─ history/              │  conversiones pasadas
│  │  ├─ settings/             │  preferencias
│  │  └─ engines/              │  estado de ffmpeg/ffprobe
│  ├─ lib/
│  │  ├─ tauri.ts              │  puente tipado hacia Rust (único import de @tauri-apps)
│  │  ├─ cn.ts                 │  merge de clases Tailwind
│  │  └─ format-matrix.ts      │  (pendiente) grafo origen → destino
│  ├─ store/                   ← estado global (Zustand + persist)
│  │  └─ app-store.ts
│  └─ styles/
│     └─ globals.css           ← tokens de diseño + base de Tailwind v4
│
├─ src-tauri/                  ← BACKEND (Rust)
│  ├─ src/
│  │  ├─ main.rs               │  arranque del binario
│  │  ├─ lib.rs                │  builder de Tauri + comandos registrados
│  │  └─ engines.rs            │  detección de ffmpeg / ffprobe / calibre
│  ├─ binaries/                │  sidecars (no versionados)
│  ├─ capabilities/            │  permisos del webview
│  ├─ icons/
│  ├─ Cargo.toml
│  └─ tauri.conf.json          ← ventana, bundle, identifier
│
└─ scripts/
   └─ fetch-binaries.mjs       ← verificación de sidecars
```

### Regla de dependencias

`features → components → lib`, nunca al revés.
`features/` no importa de otra `features/`: si algo se comparte, sube a `components/` o `lib/`.

---

## Decisiones tomadas

- **HashRouter** en lugar de BrowserRouter: en producción el frontend se sirve desde un protocolo propio de Tauri y las rutas por historial rompen al refrescar.
- **Tailwind v4** sin `tailwind.config.js`: los tokens viven en `@theme` dentro de `globals.css`.
- **Tokens derivados de `DESIGN.md`**: canvas `#0F1117`, crimson `#F43F5E`, cyan `#38BDF8`, Inter + JetBrains Mono, radios 4/6/8/10px.
- **Fuentes empaquetadas** (`@fontsource-variable`): la app es offline, no puede depender de Google Fonts.
- **Zustand** para estado de UI; el estado de negocio real (cola, jobs) vendrá del backend, no de un store duplicado.
- **Un solo puente** `lib/tauri.ts`: si mañana se mockea el backend para probar la UI, se cambia ahí y nada más.
- **Sidecars fuera de Git**: los binarios de FFmpeg pesan ~40 MB y se verifican con `pnpm setup:binaries`.

---

## Estado actual

- [x] Scaffold Vite + React 19 + TS + Tailwind v4
- [x] Tauri 2 configurado (ventana 1280×820, tema oscuro, identifier propio)
- [x] Shell de navegación: sidebar colapsable persistente + topbar + 5 rutas
- [x] Comando Rust `engine_status` conectado a la UI (detecta FFmpeg del sistema)
- [ ] Diseño de la pantalla de inicio
- [ ] Matriz de formatos y flujo de conversión
- [ ] Cola con progreso real de FFmpeg
- [ ] Historial persistente en SQLite
