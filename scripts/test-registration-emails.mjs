import assert from "node:assert/strict";
import { buildRegistrationEmail } from "../supabase/functions/seasonal-email-worker/templates.mjs";
const registration = {
  full_name: "Test <script>alert(1)</script>",
  email: "client@example.invalid",
  phone: "+17025550123",
  membership: "guest"
};
const options = {
  from: "Inferno Hot Pilates <staff@example.invalid>",
  staffEmail: "staff@example.invalid"
};
const client = buildRegistrationEmail(registration, "client", options);
assert.equal(client.to, registration.email);
assert.equal(client.reply_to, options.staffEmail);
assert.ok(client.html.includes("&lt;script&gt;"));
assert.ok(!client.html.includes("<script>"));
assert.ok(client.text.includes("front desk upon arrival"));
assert.ok(client.text.includes("TNT session"));
assert.ok(client.text.includes("November 26, 2026"));
const staff = buildRegistrationEmail(registration, "staff", options);
assert.equal(staff.to, options.staffEmail);
assert.ok(staff.text.includes(registration.email));
assert.ok(staff.text.includes("Please contact this guest"));
const member = buildRegistrationEmail(
  { ...registration, membership: "member" },
  "client",
  options
);
assert.ok(member.text.includes("Complimentary"));
assert.ok(!member.text.includes("$45"));
const general = buildRegistrationEmail(
  { ...registration, membership: null },
  "client",
  options
);
assert.ok(general.text.includes("holding strong together"));
assert.ok(!/complimentary|\$45|follow-up/i.test(general.text));
const generalStaff = buildRegistrationEmail(
  { ...registration, membership: null },
  "staff",
  options
);
assert.ok(generalStaff.text.includes("General registration"));
assert.throws(() => buildRegistrationEmail(registration, "other", options));
for (const email of [
  "client@example.com,other",
  "<client@example.com>",
  "group:client@example.com;",
  "client@example.com\r\nBcc:other@example.com",
  ".client@example.com",
  "client..two@example.com"
]) {
  assert.throws(
    () => buildRegistrationEmail({ ...registration, email }, "client", options),
    /single valid/
  );
}
console.log("Registration email template checks passed. No emails sent.");
