import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = new URL("../public/", import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

const favicon = await readFile(new URL("favicon.svg", dir));
const og = await readFile(new URL("og.svg", dir));

await sharp(favicon).resize(32, 32).png().toFile(out("favicon.png"));
await sharp(favicon)
  .resize(180, 180)
  .flatten({ background: "#0b0d12" })
  .png()
  .toFile(out("apple-touch-icon.png"));
await sharp(og).png({ compressionLevel: 9 }).toFile(out("og.png"));

console.log(
  "Assets generados en public/: favicon.png, apple-touch-icon.png, og.png",
);
