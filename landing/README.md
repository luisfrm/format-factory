# Format Factory · Landing

Landing estática de [Format Factory](https://github.com/luisfrm/format-factory),
pensada para SEO, descargas y cero mantenimiento. Se despliega en **Cloudflare
Workers (Static Assets)** sin Worker script: las peticiones a los archivos son
gratuitas e ilimitadas.

---

## Stack recomendado

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Astro 7** (`output: "static"`) | Genera HTML en el build. Sin runtime, sin hidratación y sin JS en el cliente. |
| Estilos | **Tailwind CSS 4** + tokens propios | Mismo lenguaje visual que la app (Inter, JetBrains Mono, crimson). |
| Fuentes | **Fontsource** (self-hosted) | Sin peticiones a Google Fonts; mejor LCP y privacidad. |
| Datos de release | **API de GitHub en build** | La versión y los enlaces se resuelven una vez; cero peticiones en runtime. |
| Hosting | **Workers Static Assets** | CDN global, TLS, assets gratis e ilimitados. No hay Worker que facturar. |
| Descargas | **GitHub Releases** (por defecto) o **R2** | GitHub ya publica los instaladores. R2 da URLs propias y egress gratis. |
| CI/CD | **GitHub Actions + Wrangler** | Deploy en cada release o cambio de la landing. |

### ¿Por qué no Vite + React?

Porque esta página no necesita estado ni interacción: es contenido y enlaces.
Una SPA de React renderiza en el cliente, lo que empeora el LCP y deja el SEO y
las tarjetas sociales en manos de JavaScript. Astro no añade un runtime: compila
el mismo HTML que escribirías a mano, pero con componentes, sitemap, datos de
release y presupuesto de rendimiento. La build tarda ~4 s y el resultado pesa
~42 KB de CSS y **0 KB de JS**.

React solo tendría sentido si más adelante añades una isla interactiva (por
ejemplo, detectar el sistema operativo o un contador de descargas). Se puede
añadir una isla sin cambiar el resto.

---

## Cómo se sirve y cuánto cuesta

```
GitHub Actions
   └─ pnpm build  ──►  landing/dist/  (HTML, CSS, fuentes, OG)
                          │
                          ▼
              Cloudflare Workers Static Assets
              (sin `main`, sin Worker script)
                          │
        ┌─────────────────┴──────────────────┐
        ▼                                    ▼
  HTML/CSS/fuentes                     Instaladores
  gratis e ilimitado            GitHub Releases o R2 + dominio
```

- **Assets en Workers:** las peticiones que coinciden con un archivo se sirven
  sin invocar código. Son **gratis e ilimitadas**, también en el plan Free.
- **Worker script:** este proyecto **no tiene** `main`, así que no hay
  invocaciones que consuman la cuota de 100.000/día.
- **R2:** no hace falta para la web. Si lo usas para los binarios, el dominio
  público del bucket sirve los archivos sin pasar por un Worker. Egress gratis;
  free tier de 10 GB-month, 1 M operaciones Clase A y 10 M Clase B al mes.
- **GitHub Releases:** opción por defecto. No añade infraestructura y el
  workflow de la app ya sube los instaladores ahí.

> **Importante:** si algún día añades un Worker (`main`) para APIs, auth o
> headers dinámicos, esas rutas sí se facturan. Los assets seguirán siendo
> gratuitos.

---

## Empezar

Requisitos: **Node ≥ 22.23.4** y **pnpm 11**.

```bash
cd landing
pnpm install
pnpm dev          # http://localhost:4321
pnpm check        # tipos + diagnóstico de Astro
pnpm build        # genera dist/
pnpm preview      # sirve dist/ en local
```

### Variables de entorno

Crea `landing/.env` (está ignorado por Git):

```dotenv
# Dominio público. Se usa en canonical, OG, sitemap y JSON-LD.
SITE_URL=https://formatfactory.luisrivas.site

# Opcional: sirve los instaladores desde R2 en vez de GitHub.
# PUBLIC_DOWNLOAD_BASE=https://downloads.tu-dominio.com

# Opcional: evita el rate limit de la API de GitHub en CI.
# GITHUB_TOKEN=ghp_...
```

Sin `SITE_URL`, el build usa `https://format-factory.example` como marcador y
avisa por consola. **Cámbialo antes de desplegar** o el canonical y el sitemap
apuntarán a un dominio que no es el tuyo.

### Datos de la última release

`src/lib/releases.ts` consulta `api.github.com/repos/luisfrm/format-factory/releases/latest`
**durante el build** y genera los botones con nombre, tamaño y URL exactos. Si
la API falla, el build no se rompe: los botones apuntan a GitHub Releases.

Por eso el workflow se dispara con `release: published` y vuelve a construir la
landing cuando sale una versión nueva. No hay llamadas a la API desde el
navegador.

---

## Desplegar en Cloudflare Workers

### 1. Cuenta y autenticación

Necesitas una cuenta de Cloudflare (el plan Free sirve). En local:

```bash
cd landing
pnpm dlx wrangler login
```

En CI se usan dos secretos:

| Secreto | Para qué |
|---|---|
| `CLOUDFLARE_API_TOKEN` | **Workers Scripts: Edit** + **Workers Routes: Edit** en la zona. Añade **R2: Edit** solo si usas R2. |
| `CLOUDFLARE_ACCOUNT_ID` | ID de la cuenta, visible en el dashboard. |

### 2. Primer deploy (sin `.workers.dev`)

```bash
cd landing
SITE_URL="https://formatfactory.luisrivas.site" pnpm deploy
```

El proyecto no tiene `main`: solo sube `dist/` como assets. `wrangler.jsonc`
declara `workers_dev: false` y `preview_urls: false`, así que **no se publica
ninguna URL `*.workers.dev`**. El Worker queda desplegado pero sin URL pública
hasta que se añade el Custom Domain.

`SITE_URL` **no crea DNS**: solo indica al build qué dominio escribir en
canonical, sitemap, robots y Open Graph. Debe ser el dominio final.

### 3. Custom Domain en el dashboard

El dominio debe estar activo en la misma cuenta de Cloudflare y
`formatfactory.luisrivas.site` no debe tener un registro DNS previo. Después del
primer deploy:

1. **Workers & Pages → format-factory-landing → Settings → Domains & Routes**.
2. **Add → Custom Domain**.
3. Escribe `formatfactory.luisrivas.site`.

Cloudflare crea el registro DNS y el certificado automáticamente. No hay que
crear un CNAME a mano ni declarar `routes` en `wrangler.jsonc`: los deploys
posteriores no tocan los dominios que Wrangler no gestiona.

### 4. CI/CD

El workflow [`.github/workflows/landing.yml`](../.github/workflows/landing.yml)
hace `check + build + deploy` cuando:

- cambia algo en `landing/` en `master`;
- se publica un release de la app;
- se lanza a mano (`workflow_dispatch`).

En GitHub configura:

- **Repository secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- **Repository variables:** `SITE_URL=https://formatfactory.luisrivas.site`.
  `PUBLIC_DOWNLOAD_BASE` solo si usas R2; con GitHub Releases no se define.

En pull requests solo ejecuta `check + build`, sin tocar producción.

---

## Descargas desde R2 (opcional)

GitHub Releases es suficiente para empezar. R2 tiene sentido si quieres URLs
estables con tu marca (`downloads.tudominio.com`) y no depender de GitHub.

```bash
# 1. Crear el bucket
pnpm dlx wrangler r2 bucket create format-factory-downloads

# 2. Conectarlo a un dominio
#    Dashboard → R2 → format-factory-downloads → Settings → Custom Domains
#    Ejemplo: downloads.tu-dominio.com

# 3. Subir cada asset del release con la misma clave que usa la landing
pnpm dlx wrangler r2 object put \
  "format-factory-downloads/v0.1.0/Format-Factory_0.1.0_windows-x64-setup.exe" \
  --file "ruta/al/Format-Factory_0.1.0_windows-x64-setup.exe" --remote
```

La landing construye las URLs como
`${PUBLIC_DOWNLOAD_BASE}/<tag>/<archivo>`. Si defines la variable y reconstruyes,
todos los botones (incluidos checksums e instrucciones) pasan a R2. El bucket
sirve los archivos directamente: **no consume peticiones de Workers**.

Para automatizarlo, añade un paso al workflow de release que suba los assets a
R2 con las mismas claves. El token necesita permiso **R2: Edit**.

---

## Estructura

```
landing/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro          Landing (hero, producto, formatos, descarga, FAQ)
│  │  ├─ descargar.astro      Página de descargas e instrucciones
│  │  ├─ privacidad.astro     Política de privacidad
│  │  ├─ 404.astro
│  │  └─ robots.txt.ts        robots.txt con el sitemap
│  ├─ components/             Header, footer, logo, iconos, mock de la app
│  ├─ layouts/Base.astro      Meta tags, OG, canonical y JSON-LD
│  ├─ lib/releases.ts         GitHub API en build + URLs de descarga
│  ├─ content.ts              Copia, features, formatos y FAQ
│  ├─ consts.ts               Datos del sitio y enlaces
│  └─ styles/global.css       Tokens de diseño y componentes
├─ public/                    favicon, OG 1200×630, iconos
├─ scripts/generate-assets.mjs
├─ design-system/             Decisiones de UI/UX persistidas
├─ astro.config.mjs
├─ wrangler.jsonc
└─ package.json
```

---

## SEO y rendimiento

- HTML estático, un solo `<h1>` y jerarquía semántica.
- `title`, `description`, canonical, Open Graph y Twitter Card por página.
- JSON-LD `SoftwareApplication`, `WebSite` y `BreadcrumbList`.
- `sitemap-index.xml` + `robots.txt` generados en el build.
- OG image 1200×630 en `public/og.png`.
- Fuentes self-hosted con `font-display: swap`.
- Sin JS de cliente, sin cookies y sin analítica.
- `prefers-reduced-motion` y foco visible en todos los controles.
- 404 real (`not_found_handling: "404-page"`), no una SPA que responde 200 a todo.

Comprobaciones útiles:

```bash
pnpm check
pnpm build
pnpm exec wrangler deploy --dry-run   # valida configuración sin publicar
```

---

## Checklist para lanzar

- [ ] `SITE_URL=https://formatfactory.luisrivas.site` en Variables.
- [ ] Zona `luisrivas.site` activa en la misma cuenta de Cloudflare.
- [ ] Custom Domain `formatfactory.luisrivas.site` añadido desde el dashboard.
- [ ] `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en GitHub.
- [ ] Primer `pnpm deploy` correcto.
- [ ] Revisar `/`, `/descargar/`, `/privacidad/`, `/robots.txt` y `/sitemap-index.xml`.
- [ ] Probar una descarga real desde el botón de Windows.
- [ ] Enviar el sitemap en Search Console (cuando el dominio esté activo).
- [ ] (Opcional) Bucket R2 + dominio + `PUBLIC_DOWNLOAD_BASE`.

## Mantenimiento

- **Nueva versión de la app:** no hay que tocar la landing. El release dispara
  el workflow y el build lee la versión nueva.
- **Cambiar textos:** `src/content.ts` y las páginas.
- **Cambiar tokens o estilos:** `src/styles/global.css` y
  `design-system/format-factory/MASTER.md`.
- **Regenerar favicon/OG:** `pnpm assets`.
