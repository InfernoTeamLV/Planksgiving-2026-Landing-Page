import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

// Apply the same common security headers to local production previews. Vite dev
// keeps its normal policy so hot reload works; Netlify remains authoritative.
const commonHeaders = readFileSync("netlify.toml", "utf8")
  .split("[headers.values]")[1]
  .split("[[headers]]")[0];
const previewHeaders = Object.fromEntries(
  [...commonHeaders.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"([^"]*)"/gm)].map(
    ([, name, value]) => [name, value]
  )
);

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const url = process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
    const key =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (url !== "https://jngvmbwwrjlgglqsrggw.supabase.co" || !key) {
      throw new Error(
        "Production requires the TNT Supabase URL and browser-safe publishable key. Configure both VITE_SUPABASE variables in Netlify before building."
      );
    }
    let publicKey = key.startsWith("sb_publishable_");
    if (!publicKey) {
      try {
        publicKey =
          JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString())
            .role === "anon";
      } catch {
        /* Invalid keys are rejected below without printing credentials. */
      }
    }
    if (!publicKey)
      throw new Error(
        "A private or invalid Supabase key cannot be included in a public website."
      );
  }
  return {
    plugins: [react()],
    build: { sourcemap: false },
    server: { host: "127.0.0.1", port: 5174, strictPort: true },
    preview: {
      host: "127.0.0.1",
      port: 4174,
      strictPort: true,
      headers: previewHeaders
    }
  };
});
