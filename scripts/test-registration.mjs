import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/lib/registration.ts", import.meta.url),
  "utf8"
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
});
const { validateRegistration, submitRegistration } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const valid = {
  fullName: "  Jane   Doe ",
  email: " JANE@example.com ",
  phone: "(702) 555-0123",
  membership: "guest",
  ageConfirmed: true
};
const result = validateRegistration(valid);
assert.deepEqual(result.errors, {});
assert.equal(result.value.fullName, "Jane Doe");
assert.equal(result.value.email, "jane@example.com");
assert.equal(result.value.phone, "+17025550123");
assert.equal(
  validateRegistration({ ...valid, phone: "+44 7700 900123" }).value.phone,
  "+447700900123"
);
const invalid = validateRegistration({
  fullName: " ",
  email: "bad",
  phone: "hello123",
  membership: "other",
  ageConfirmed: false
});
assert.deepEqual(Object.keys(invalid.errors).sort(), [
  "ageConfirmed",
  "email",
  "fullName",
  "membership",
  "phone"
]);
assert.ok(validateRegistration({ ...valid, phone: "1234567890123456" }).errors.phone);
for (const email of [
  "client@example.com,other",
  "<client@example.com>",
  "group:client@example.com;",
  "client@example.com\r\nBcc:other@example.com",
  ".client@example.com",
  "client..two@example.com"
]) {
  assert.ok(validateRegistration({ ...valid, email }).errors.email);
}
for (const email of ["jane+event@example.com", "o'neil@example.com"]) {
  assert.equal(validateRegistration({ ...valid, email }).errors.email, undefined);
}
let calls = 0;
await assert.rejects(
  submitRegistration(result.value, "", async () => {
    calls++;
  }),
  /not available yet/
);
assert.equal(calls, 0);
await submitRegistration(
  result.value,
  "/rest/v1/tnt_seasonal_form_submissions",
  async (url, options) => {
    assert.equal(options.headers.apikey, "sb_publishable_test");
    const payload = JSON.parse(options.body);
    assert.equal(payload.form_key, "planksgiving-2026");
    assert.equal(payload.full_name, "Jane Doe");
    assert.equal(payload.age_confirmed, true);
    assert.equal(payload.email, "jane@example.com");
    assert.equal(payload.status, undefined);
    return new Response(null, { status: 201 });
  },
  "sb_publishable_test"
);
const endpoint = "/api/registrations";
await submitRegistration(result.value, endpoint, async (url, options) => {
  assert.equal(url, endpoint);
  assert.equal(options.method, "POST");
  assert.equal(JSON.parse(options.body).membership, "guest");
  return Response.json({ ok: true });
});
for (const [status, message] of [
  [409, /already registered/],
  [429, /too many/i],
  [500, /couldn’t save/]
]) {
  await assert.rejects(
    submitRegistration(
      result.value,
      endpoint,
      async () => new Response("", { status })
    ),
    message
  );
}
await assert.rejects(
  submitRegistration(
    result.value,
    endpoint,
    async () => new Response("<html>Fallback</html>")
  ),
  /couldn’t confirm/
);
await assert.rejects(
  submitRegistration(result.value, endpoint, async () => Response.json({ ok: false })),
  /couldn’t confirm/
);
await assert.rejects(
  submitRegistration(result.value, endpoint, async () => {
    throw new Error("offline");
  }),
  /connection/
);
console.log("Registration validation and submission checks passed.");
