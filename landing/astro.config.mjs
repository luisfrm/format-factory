import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
// `||` y no `??`: en GitHub Actions una variable no configurada llega como "".
const siteUrl = (process.env.SITE_URL || env.SITE_URL || "").trim();

if (!siteUrl) {
  console.warn(
    "[landing] SITE_URL no está definido: se usa https://format-factory.example como marcador. " +
      "Defínelo antes de desplegar para que canonical, OG y sitemap apunten al dominio real.",
  );
}

const site = siteUrl || "https://format-factory.example";

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/404/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: "auto",
  },
});
