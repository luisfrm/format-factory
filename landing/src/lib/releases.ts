import { request } from "node:https";
import { SITE } from "@/consts";

const REPO = "luisfrm/format-factory";
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

export interface ReleaseAsset {
  name: string;
  size: number;
  url: string;
}

export interface ReleaseInfo {
  tag: string | null;
  version: string | null;
  publishedAt: string | null;
  notesUrl: string;
  assets: ReleaseAsset[];
  /** false cuando la API falló y solo tenemos enlaces al release. */
  available: boolean;
}

export interface DownloadItem {
  label: string;
  name?: string;
  size?: number;
  url: string;
}

export interface PlatformDownload {
  id: "windows" | "macos" | "linux";
  name: string;
  detail: string;
  primary: DownloadItem;
  alternate?: DownloadItem;
  recommended?: boolean;
}

let pending: Promise<ReleaseInfo> | null = null;

/** Se resuelve una vez por build: cero peticiones en runtime. */
export function getRelease(): Promise<ReleaseInfo> {
  pending ??= fetchLatestRelease();
  return pending;
}

async function fetchLatestRelease(): Promise<ReleaseInfo> {
  const token = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "format-factory-landing",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await requestJson(API, headers);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`GitHub respondió ${response.status}`);
    }

    const data = JSON.parse(response.body) as {
      tag_name?: unknown;
      published_at?: unknown;
      html_url?: unknown;
      assets?: Array<{
        name?: unknown;
        size?: unknown;
        browser_download_url?: unknown;
      }>;
    };

    if (typeof data.tag_name !== "string" || !Array.isArray(data.assets)) {
      throw new Error("Respuesta de GitHub sin tag o assets");
    }

    const assets = data.assets
      .filter(
        (asset) =>
          typeof asset.name === "string" &&
          typeof asset.browser_download_url === "string",
      )
      .map((asset) => ({
        name: asset.name as string,
        size: typeof asset.size === "number" ? asset.size : 0,
        url: asset.browser_download_url as string,
      }));

    return {
      tag: data.tag_name,
      version: data.tag_name.replace(/^v/, ""),
      publishedAt:
        typeof data.published_at === "string" ? data.published_at : null,
      notesUrl:
        typeof data.html_url === "string" ? data.html_url : SITE.latestRelease,
      assets,
      available: true,
    };
  } catch (error) {
    // El build nunca debe romperse por la API: los botones caen al release.
    console.warn(
      `[releases] No se pudo leer la última versión (${String(error)}). ` +
        "Se enlazará a GitHub Releases.",
    );
    return {
      tag: null,
      version: null,
      publishedAt: null,
      notesUrl: SITE.latestRelease,
      assets: [],
      available: false,
    };
  }
}

export function platformDownloads(release: ReleaseInfo): PlatformDownload[] {
  const windowsSetup = findAsset(release, /windows-x64-setup\.exe$/i);
  const windowsMsi = findAsset(release, /windows-x64\.msi$/i);
  const macOS = findAsset(release, /macos-arm64\.dmg$/i);
  const linuxAppImage = findAsset(release, /linux-x64\.AppImage$/i);
  const linuxDeb = findAsset(release, /linux-x64\.deb$/i);

  return [
    {
      id: "windows",
      name: "Windows",
      detail: "Windows 10 u 11 · x64",
      recommended: true,
      primary: toDownloadItem(release, windowsSetup, "Descargar .exe"),
      alternate: windowsMsi
        ? toDownloadItem(release, windowsMsi, "Descargar .msi")
        : undefined,
    },
    {
      id: "macos",
      name: "macOS",
      detail: "macOS 12+ · Apple Silicon",
      primary: toDownloadItem(release, macOS, "Descargar .dmg"),
    },
    {
      id: "linux",
      name: "Linux",
      detail: "Linux x64 · AppImage",
      primary: toDownloadItem(release, linuxAppImage, "Descargar AppImage"),
      alternate: linuxDeb
        ? toDownloadItem(release, linuxDeb, "Descargar .deb")
        : undefined,
    },
  ];
}

export function releaseExtras(release: ReleaseInfo): {
  checksums: DownloadItem;
  install: DownloadItem;
} {
  const sums = findAsset(release, /SHA256SUMS\.txt$/i);
  const install = findAsset(release, /INSTALL\.md$/i);

  return {
    checksums: sums
      ? toDownloadItem(release, sums, "SHA256SUMS.txt")
      : { label: "Ver release", url: release.notesUrl },
    install: install
      ? toDownloadItem(release, install, "Instrucciones")
      : { label: "Guía de instalación", url: SITE.install },
  };
}

/**
 * Petición HTTPS con agente de un solo uso. Evita el socket keep-alive de
 * `fetch`, que en Node 24.15 (Windows) deja un handle vivo y hace que el
 * proceso de Astro termine con una aserción de libuv.
 */
function requestJson(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      { method: "GET", headers, agent: false, timeout: 8_000 },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
        response.on("error", reject);
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("La petición a GitHub superó 8 s"));
    });
    req.on("error", reject);
    req.end();
  });
}

function findAsset(
  release: ReleaseInfo,
  pattern: RegExp,
): ReleaseAsset | undefined {
  return release.assets.find((asset) => pattern.test(asset.name));
}

function toDownloadItem(
  release: ReleaseInfo,
  asset: ReleaseAsset | undefined,
  label: string,
): DownloadItem {
  if (!asset) {
    return { label: "Ver release", url: release.notesUrl };
  }

  return {
    label,
    name: asset.name,
    size: asset.size,
    url: publicUrl(release, asset),
  };
}

/**
 * Si PUBLIC_DOWNLOAD_BASE está definido, los binarios se sirven desde R2
 * (dominio propio) en /<tag>/<archivo>. Si no, se usa GitHub Releases.
 */
function publicUrl(release: ReleaseInfo, asset: ReleaseAsset): string {
  const base = import.meta.env.PUBLIC_DOWNLOAD_BASE?.trim().replace(/\/+$/, "");
  if (!base || !release.tag) return asset.url;
  return `${base}/${release.tag}/${asset.name}`;
}

export function formatBytes(bytes?: number): string | null {
  if (!bytes) return null;
  const mb = bytes / 1024 / 1024;
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1).replace(".", ",")} GB`;
  }
  return `${mb.toFixed(1).replace(".", ",")} MB`;
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function versionLabel(release: ReleaseInfo): string {
  return release.version ? `v${release.version}` : "última versión";
}
