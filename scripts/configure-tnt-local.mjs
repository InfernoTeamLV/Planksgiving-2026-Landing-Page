import { readFile, writeFile } from "node:fs/promises";

const readEnv = (source) =>
  Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const split = line.indexOf("=");
        return [
          line.slice(0, split),
          line
            .slice(split + 1)
            .trim()
            .replace(/^['"]|['"]$/g, "")
        ];
      })
  );
const source = readEnv(
  await readFile(new URL("../../.env.local", import.meta.url), "utf8")
);
const projectUrl = source.VITE_SUPABASE_URL;
const key = source.VITE_SUPABASE_PUBLISHABLE_KEY;
if (new URL(projectUrl).hostname !== "jngvmbwwrjlgglqsrggw.supabase.co")
  throw new Error("Unexpected TNT project.");
if (!key?.startsWith("sb_publishable_")) {
  const claims = JSON.parse(
    Buffer.from(key?.split(".")[1] ?? "", "base64url").toString()
  );
  if (claims.role !== "anon")
    throw new Error("Only a browser-safe public key may be copied.");
}
const target = new URL("../.env.local", import.meta.url);
const env = readEnv(await readFile(target, "utf8").catch(() => ""));
env.VITE_SUPABASE_URL = projectUrl;
env.VITE_SUPABASE_PUBLISHABLE_KEY = key;
await writeFile(
  target,
  Object.entries(env)
    .map(([name, value]) => `${name}=${value}`)
    .join("\n") + "\n"
);
console.log(
  "Configured the TNT URL and browser-safe public key in ignored .env.local."
);
