import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const query = (sql, args = []) => db.query(sql, args);
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema public,auth to anon,authenticated,service_role;
    create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;`);
  for (const file of [
    "20261106211254_tnt_seasonal_form_submissions.sql",
    "20261106220134_tnt_seasonal_email_outbox.sql"
  ]) {
    await db.exec(
      await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8")
    );
  }
  await db.exec(`update public.tnt_seasonal_forms set closes_at=now()+interval '1 day'; set role anon;
    insert into public.tnt_seasonal_form_submissions(form_key,full_name,email,phone,membership,age_confirmed)
    values ('planksgiving-2026','Queue Test','queue@example.invalid','+17025550123','member',true);`);
  await assert.rejects(() => query("select * from private.tnt_seasonal_email_outbox"));
  await assert.rejects(() => query("select public.claim_seasonal_registration_mail()"));
  await db.exec("reset role;set role service_role;");
  const jobs = (await query("select public.claim_seasonal_registration_mail() as jobs"))
    .rows[0].jobs;
  assert.equal(jobs.length, 2);
  assert.deepEqual(jobs.map((j) => j.kind).sort(), ["client", "staff"]);
  assert.equal(
    (await query("select public.claim_seasonal_registration_mail() as jobs")).rows[0]
      .jobs.length,
    0
  );
  const finish = (job, outcome, token = job.lease_token) =>
    query(
      "select public.finish_seasonal_registration_mail($1,$2,$3,'test') as finished",
      [job.id, token, outcome]
    );
  assert.equal(
    (await finish(jobs[0], "accepted", "00000000-0000-0000-0000-000000000000")).rows[0]
      .finished,
    false
  );
  assert.equal((await finish(jobs[0], "accepted")).rows[0].finished, true);
  assert.equal((await finish(jobs[0], "retry")).rows[0].finished, false);
  await finish(jobs[1], "retry");
  assert.equal(
    (
      await query(
        "select count(*)::int as n from private.tnt_seasonal_email_outbox where status='pending'"
      )
    ).rows[0].n,
    1
  );
  await query(
    "update private.tnt_seasonal_email_outbox set available_at=now()-interval '1 minute' where status='pending'"
  );
  const retry = (
    await query("select public.claim_seasonal_registration_mail() as jobs")
  ).rows[0].jobs[0];
  assert.ok(retry.lease_token !== jobs[1].lease_token);
  await query(
    "update private.tnt_seasonal_email_outbox set locked_until=now()-interval '1 minute' where status='processing'"
  );
  assert.equal(
    (await query("select public.claim_seasonal_registration_mail() as jobs")).rows[0]
      .jobs.length,
    0
  );
  assert.equal(
    (
      await query(
        "select count(*)::int as n from private.tnt_seasonal_email_outbox where status='uncertain'"
      )
    ).rows[0].n,
    1
  );
  await query(
    "delete from public.tnt_seasonal_form_submissions where email='queue@example.invalid'"
  );
  assert.equal(
    (await query("select count(*)::int as n from private.tnt_seasonal_email_outbox"))
      .rows[0].n,
    0
  );
  console.log(
    "Email queue checks passed: private access, two recipients, exclusive claims, lease protection, retry, interrupted-send hold, and cleanup."
  );
} finally {
  await db.close();
}
