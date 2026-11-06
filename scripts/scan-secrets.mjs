// Scan working files and every reachable Git blob; report locations, never values.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const findings = [];
let checked = 0;
function check(label, source) {
  checked++;
  const patterns = [
    ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["Supabase secret", /\bsb_secret_[A-Za-z0-9_-]{20,}/],
    ["Supabase access token", /\bsbp_[a-zA-Z0-9]{20,}/],
    [
      "GitHub credential",
      /\b(?:gh[pousr]_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]{40,})/
    ],
    ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["embedded database password", /postgres(?:ql)?:\/\/[^\s:/]+:[^\s@/]+@/i],
    [
      "assigned secret",
      /(?:SEASONAL_SMTP_PASSWORD|SEASONAL_EMAIL_WORKER_SECRET|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*["']?[a-zA-Z0-9_-]{16,}/
    ]
  ];
  for (const [kind, pattern] of patterns)
    if (pattern.test(source)) findings.push({ label, kind });
  for (const match of source.matchAll(
    /eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g
  )) {
    try {
      const claims = JSON.parse(Buffer.from(match[1], "base64url").toString());
      if (claims.role && claims.role !== "anon")
        findings.push({ label, kind: "non-public JWT" });
    } catch {
      /* Not a JSON token. */
    }
  }
}
const working = [
  ...new Set(
    git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean)
  )
];
for (const file of working) {
  if (/\.(?:png|webp|gif)$/i.test(file)) {
    const metadata = await sharp(file).metadata();
    if (metadata.exif || metadata.xmp)
      findings.push({ label: file, kind: "embedded image metadata" });
    continue;
  }
  if (/\.(?:png|webp|gif|ico|woff2?)$/i.test(file)) continue;
  const source = await readFile(file, "utf8");
  check(file, source);
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example"))
    findings.push({ label: file, kind: "environment file included in Git" });
}
const objects = git(["rev-list", "--objects", "--all"]).split(/\r?\n/).filter(Boolean);
for (const line of objects) {
  const [id, ...name] = line.split(" ");
  if (git(["cat-file", "-t", id]).trim() !== "blob") continue;
  if (/\.(?:png|webp|gif|ico|woff2?)$/i.test(name.join(" "))) continue;
  check(`history:${name.join(" ")}@${id.slice(0, 8)}`, git(["cat-file", "-p", id]));
}
console.log(JSON.stringify({ checked, findings }, null, 2));
if (findings.length) process.exitCode = 1;
