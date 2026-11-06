import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

await mkdir("public/images", { recursive: true });
const assets = [
  {
    source: "design-assets/inferno-logo-transparent.png",
    output: "public/images/inferno-logo-transparent.webp",
    width: 320,
    lossless: true
  },
  {
    source: "design-assets/registration-autumn-background.png",
    output: "public/images/registration-autumn-background.webp",
    width: 1920,
    quality: 85
  },
  {
    source: "design-assets/planksgiving-turkey.gif",
    output: "public/images/planksgiving-turkey.webp",
    animated: true,
    quality: 88
  }
];
for (const { source, output, width, animated, ...options } of assets) {
  await sharp(source, { animated: !!animated })
    .resize({ width, withoutEnlargement: true })
    .webp({ ...options, effort: 6 })
    .toFile(output);
  const before = (await stat(source)).size;
  const after = (await stat(output)).size;
  console.log(
    `${output}: ${before} → ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`
  );
}
