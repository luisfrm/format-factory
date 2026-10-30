/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Base pública de R2, p. ej. https://downloads.tu-dominio.com */
  readonly PUBLIC_DOWNLOAD_BASE?: string;
  /** Token opcional para evitar el rate limit de la API de GitHub en CI. */
  readonly GITHUB_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
