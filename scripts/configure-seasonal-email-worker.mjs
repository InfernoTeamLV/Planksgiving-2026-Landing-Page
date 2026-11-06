// Run once after deployment, using an authenticated Supabase CLI. No mailbox
// password is handled here. The worker key is generated locally and never logged.
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const project = "jngvmbwwrjlgglqsrggw";
const cli = resolve("../node_modules/supabase/dist/supabase.js");
const run = (args) =>
  execFileSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
const folder = await mkdtemp(join(tmpdir(), "seasonal-mail-"));
let stage = "creating worker key";
let key = "";
try {
  key = randomBytes(32).toString("hex");
  const envFile = join(folder, ".env");
  const sqlFile = join(folder, "worker.sql");
  await writeFile(envFile, `SEASONAL_EMAIL_WORKER_SECRET=${key}\n`, { mode: 0o600 });
  stage = "saving worker secret";
  run([
    "secrets",
    "set",
    "--env-file",
    envFile,
    "--project-ref",
    project,
    "--workdir",
    "."
  ]);
  await writeFile(
    sqlFile,
    `do $$ declare existing_id uuid; begin
    select id into existing_id from vault.secrets where name='seasonal_email_worker_secret';
    if existing_id is null then perform vault.create_secret('${key}','seasonal_email_worker_secret');
    else perform vault.update_secret(existing_id,'${key}'); end if;
    end $$;`,
    { mode: 0o600 }
  );
  stage = "saving Vault key";
  run([
    "db",
    "query",
    "--linked",
    "--project-ref",
    project,
    "--file",
    sqlFile,
    "--workdir",
    ".",
    "--yes"
  ]);
  stage = "checking deployed worker";
  const response = await fetch(
    `https://${project}.supabase.co/functions/v1/seasonal-email-worker`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` }
    }
  );
  const body = await response.json();
  console.log(JSON.stringify({ workerStatus: response.status, result: body }));
} catch (error) {
  console.error(
    `Setup stopped while ${stage}. ${String(error.stderr ?? error.message)
      .replaceAll(key || "unused-placeholder", "[redacted]")
      .slice(-1600)}`
  );
  console.error(
    "Worker setup did not complete. Check CLI access and rerun; no credentials were logged."
  );
  process.exitCode = 1;
} finally {
  await rm(folder, { recursive: true, force: true });
}
