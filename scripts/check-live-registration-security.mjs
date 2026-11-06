// Permission and rejected-input checks. Does not save registrations or send emails.
import assert from "node:assert/strict";
process.loadEnvFile(".env.local");
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.equal(url, "https://jngvmbwwrjlgglqsrggw.supabase.co");
assert.ok(key);
const checks = [
  {
    name: "Public event metadata",
    path: "/rest/v1/tnt_seasonal_forms?select=form_key&limit=1",
    allowed: [200]
  },
  {
    name: "Public submission reads denied",
    path: "/rest/v1/tnt_seasonal_form_submissions?select=id&limit=1",
    allowed: [401, 403]
  },
  {
    name: "Public mail queue claim denied",
    path: "/rest/v1/rpc/claim_seasonal_registration_mail",
    method: "POST",
    allowed: [401, 403]
  },
  {
    name: "Public mail worker denied",
    path: "/functions/v1/seasonal-email-worker",
    method: "POST",
    allowed: [401]
  },
  {
    name: "Recipient-list injection rejected",
    path: "/rest/v1/tnt_seasonal_form_submissions",
    method: "POST",
    allowed: [400],
    body: {
      form_key: "planksgiving-2026",
      full_name: "Security Validation Check",
      email: "blocked@example.invalid,other",
      phone: "+19995550123",
      membership: "member",
      age_confirmed: true
    }
  }
];
for (const { name, path, method = "GET", allowed, body } of checks) {
  const response = await fetch(url + path, {
    method,
    headers: { apikey: key, "Content-Type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  assert.ok(
    allowed.includes(response.status),
    `${name}: unexpected HTTP ${response.status}`
  );
  console.log(`${name}: HTTP ${response.status}`);
  await response.body?.cancel();
}
