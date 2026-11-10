import { isSingleEmailAddress } from "./addresses.mjs";

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]
  );

export function buildRegistrationEmail(registration, kind, { from, staffEmail }) {
  if (!["client", "staff"].includes(kind)) throw new Error("Unsupported email kind");
  if (!isSingleEmailAddress(registration.email) || !isSingleEmailAddress(staffEmail)) {
    throw new TypeError("A single valid email address is required");
  }
  const guest = registration.membership === "guest";
  const member = registration.membership === "member";
  const entry = guest
    ? "$45 · Pay at the front desk upon arrival."
    : member
      ? "Complimentary member entry."
      : "Your Planksgiving registration is confirmed.";
  const followUp = guest
    ? "Our team will reach out to finalize your class spot."
    : member
      ? "No follow-up is needed. We look forward to seeing you there."
      : "We look forward to holding strong together.";
  const client = kind === "client";
  const subject = client
    ? "You’re in — Planksgiving 2026"
    : "New Planksgiving registration";
  const heading = client
    ? "ONE COMMUNITY. ONE STRONG HOLD."
    : "ONE MORE HOLD. ONE MORE REGISTRATION.";
  const lead = client
    ? `Hi ${registration.full_name}, your Planksgiving registration is saved. Bring your energy and see how long you can hold.`
    : "A new Planksgiving registration has been saved in TNT.";
  const details = client
    ? [
        "Thursday, November 26, 2026 · 7:00 AM Pacific",
        "9130 W Russell Rd #110 · Las Vegas, NV 89148",
        entry,
        ...(guest
          ? ["Includes the Planksgiving challenge, an IHP class, and a TNT session."]
          : []),
        followUp
      ]
    : [
        `Name: ${registration.full_name}`,
        `Email: ${registration.email}`,
        `Phone: ${registration.phone}`,
        `Entry: ${guest ? "Guest" : member ? "Member" : "General registration"}`,
        entry,
        ...(guest
          ? ["Please contact this guest to finalize their class spot."]
          : member
            ? ["No member follow-up is required."]
            : [])
      ];
  const text = `INFERNO HOT PILATES\n\n${heading}\n\n${lead}\n\n${details.join("\n")}\n\nBURN. LOVE. TRANSFORM.`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f2e2d2;color:#382316;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:auto;background:#fff8ef;border:1px solid #e6ccb6;border-radius:20px"><tr><td style="padding:36px"><p style="font-size:11px;letter-spacing:3px;color:#a65130;font-weight:bold;margin:0 0 20px">INFERNO HOT PILATES · PLANKSGIVING</p><h1 style="font-size:28px;line-height:1.15;color:#382316;margin:0 0 24px">${heading}</h1><p style="font-size:16px;line-height:1.7;color:#70513c">${escapeHtml(lead)}</p><div style="background:#f3e3d3;border-radius:12px;padding:20px;margin:24px 0">${details.map((line) => `<p style="font-size:14px;line-height:1.65;margin:8px 0">${escapeHtml(line)}</p>`).join("")}</div><p style="font-size:10px;letter-spacing:3px;color:#a65130;font-weight:bold;margin:28px 0 0">BURN. LOVE. TRANSFORM.</p></td></tr></table></td></tr></table></body></html>`;
  return {
    from,
    to: client ? registration.email : staffEmail,
    reply_to: staffEmail,
    subject,
    text,
    html
  };
}
