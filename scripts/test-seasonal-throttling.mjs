import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema public,auth to anon,authenticated,service_role;
    create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$;`);
  for (const file of [
    "20261106211254_tnt_seasonal_form_submissions.sql",
    "20261106220134_tnt_seasonal_email_outbox.sql",
    "20261106224211_seasonal_submission_throttling.sql"
  ]) {
    await db.exec(
      await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8")
    );
  }
  await db.exec(
    `update public.tnt_seasonal_forms set closes_at=now()+interval '1 day';set role anon;`
  );
  const insert = (index, phone = "+17025550123") =>
    db.query(
      `insert into public.tnt_seasonal_form_submissions
    (form_key,full_name,email,phone,membership,age_confirmed) values ('planksgiving-2026','Test Person',$1,$2,'member',true)`,
      [`test${index}@example.invalid`, phone]
    );
  for (let i = 0; i < 3; i++) await insert(i);
  const limited = (operation) =>
    assert.rejects(operation, (error) => error.code === "PT429");
  await limited(() => insert(3));
  for (let i = 3; i < 30; i++) await insert(i, `+1702555${String(i).padStart(4, "0")}`);
  await limited(() => insert(31, "+17025550999"));
  await db.exec(
    "reset role; update public.tnt_seasonal_form_submissions set created_at=now()-interval '2 minutes';set role anon;"
  );
  await insert(31, "+17025550999");
  await db.exec(
    "reset role; update public.tnt_seasonal_form_submissions set created_at=now()-interval '2 hours';set role anon;"
  );
  await insert(32);
  await assert.rejects(() =>
    db.query("select private.throttle_seasonal_submissions()")
  );
  await db.exec(`reset role;delete from public.tnt_seasonal_form_submissions;
    insert into public.tnt_seasonal_form_submissions(form_key,full_name,email,phone,membership,age_confirmed,created_at)
    select 'planksgiving-2026','Test Person','hour'||i||'@example.invalid','+1702555'||lpad(i::text,4,'0'),'member',true,now()-interval '2 minutes'
    from generate_series(1,200) i;set role anon;`);
  await limited(() => insert(201, "+17025550998"));
  await db.exec("reset role;");
  assert.equal(
    (await db.query("select count(*)::int as n from private.tnt_seasonal_email_outbox"))
      .rows[0].n,
    400
  );
  console.log(
    "Submission throttling checks passed: phone/hour, event/minute, event/hour, expiry, private access, and no mail queued for rejected inserts."
  );
} finally {
  await db.close();
}
