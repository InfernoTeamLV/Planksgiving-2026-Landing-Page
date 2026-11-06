import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
let checks = 0;
const query = (sql, args = []) => db.query(sql, args);
const insert = (email = "guest@example.com", age = true) =>
  query(
    `insert into public.tnt_seasonal_form_submissions
  (form_key,full_name,email,phone,membership,age_confirmed)
  values ('planksgiving-2026','Test Guest',$1,'+17025550123','guest',$2)`,
    [email, age]
  );
const rejects = async (operation) => {
  await assert.rejects(operation);
  checks++;
};
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; grant usage on schema public,auth to anon,authenticated;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261106211254_tnt_seasonal_form_submissions.sql",
        import.meta.url
      ),
      "utf8"
    )
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261106232824_seasonal_single_recipient_validation.sql",
        import.meta.url
      ),
      "utf8"
    )
  );
  await db.exec(
    `update public.tnt_seasonal_forms set closes_at=now()+interval '1 day'; set role anon;`
  );
  for (const email of [
    "client@example.com,other",
    "<client@example.com>",
    "group:client@example.com;",
    ".client@example.com",
    "client..two@example.com"
  ]) {
    await rejects(() => insert(email));
  }
  await insert();
  checks++;
  await rejects(() => insert());
  await rejects(() => insert("underage@example.com", false));
  await rejects(() => insert("INVALID EMAIL"));
  await rejects(() => query("select * from public.tnt_seasonal_form_submissions"));
  await rejects(() =>
    query(
      `insert into public.tnt_seasonal_form_submissions(form_key,full_name,email,phone,membership,age_confirmed,status) values ('planksgiving-2026','Spoof','spoof@example.com','+17025550123','member',true,'confirmed')`
    )
  );
  await db.exec(`reset role; set role authenticated;`);
  assert.equal(
    (await query("select count(*)::int as n from public.tnt_seasonal_form_submissions"))
      .rows[0].n,
    0
  );
  checks++;
  assert.equal(
    (
      await query(
        `update public.tnt_seasonal_form_submissions set status='confirmed' returning id`
      )
    ).rows.length,
    0
  );
  checks++;
  await db.exec(
    `reset role; select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false);set role authenticated;`
  );
  assert.equal(
    (await query("select count(*)::int as n from public.tnt_seasonal_form_submissions"))
      .rows[0].n,
    1
  );
  checks++;
  await query(`update public.tnt_seasonal_form_submissions set status='contacted'`);
  checks++;
  await db.exec(
    `reset role; update public.tnt_seasonal_forms set accepting_submissions=false; set role anon;`
  );
  await rejects(() => insert("closed@example.com"));
  await db.exec(
    `reset role; update public.tnt_seasonal_forms set accepting_submissions=true,closes_at=now()-interval '1 second';set role anon;`
  );
  await rejects(() => insert("late@example.com"));
  console.log(
    `${checks} seasonal database checks passed: validation, duplicates, closure, admin access, and public privacy.`
  );
} finally {
  await db.close();
}
