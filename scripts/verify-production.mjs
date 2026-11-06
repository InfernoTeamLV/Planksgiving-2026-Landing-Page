import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve("dist");
const walk = async (dir) =>
  (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map(async (entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
      )
    )
  ).flat();
const files = await walk(root);
const html = await readFile(join(root, "index.html"), "utf8");
assert.ok(html.includes("<title>Inferno Planksgiving 2026</title>"));
const js = (
  await Promise.all(
    files.filter((f) => f.endsWith(".js")).map((f) => readFile(f, "utf8"))
  )
).join("\n");
assert.ok(js.includes("https://infernopilates.com/home-2509"));
assert.ok(js.includes("https://infernopilates.com/client-intake-form"));
const references = new Set();
for (const file of files) {
  const name = relative(root, file);
  assert.ok(
    !/\.(?:map|sql|env|toml|ts|mjs)$/.test(name),
    `Private/source artifact published: ${name}`
  );
  assert.ok(
    !name.split(/[\\/]/).some((part) => part.startsWith(".")),
    `Hidden artifact published: ${name}`
  );
  if (!/\.(?:html|css|js|json)$/.test(name)) continue;
  const source = await readFile(file, "utf8");
  assert.ok(
    !/sb_secret_[a-zA-Z0-9_-]+|sbp_[a-zA-Z0-9]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(
      source
    ),
    `Private credential in ${name}`
  );
  for (const jwt of source.matchAll(
    /eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g
  )) {
    const claims = JSON.parse(Buffer.from(jwt[1], "base64url").toString());
    assert.ok(
      !["service_role", "supabase_admin"].includes(claims.role),
      `Privileged JWT in ${name}`
    );
  }
  for (const match of source.matchAll(
    /["'(](\/(?:assets|images)\/[^"')\s]+|\/favicon-[^"')\s]+|\/apple-touch-icon\.png)["')]/g
  ))
    references.add(match[1]);
}
for (const path of references)
  assert.ok(
    (await stat(join(root, path))).isFile(),
    `Missing production asset ${path}`
  );
let bytes = 0;
for (const file of files) bytes += (await stat(file)).size;
console.log(
  `Production checks passed: ${references.size} referenced local assets exist, both external links are bundled, no source maps/private credentials, ${files.length} files totaling ${(bytes / 1024).toFixed(0)} KiB.`
);
