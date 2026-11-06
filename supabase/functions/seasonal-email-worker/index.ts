import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import nodemailer from "npm:nodemailer@10.3.1";
import { timingSafeEqual } from "node:crypto";
import { buildRegistrationEmail } from "./templates.mjs";
import { isSingleEmailAddress } from "./addresses.mjs";

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, { error: "Method not allowed" });
  const secret = Deno.env.get("SEASONAL_EMAIL_WORKER_SECRET");
  const expected = new TextEncoder().encode(`Bearer ${secret}`);
  const supplied = new TextEncoder().encode(request.headers.get("Authorization") ?? "");
  if (
    !secret ||
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return reply(401, { error: "Unauthorized" });
  }
  const password = Deno.env.get("SEASONAL_SMTP_PASSWORD");
  const mailbox = Deno.env.get("SEASONAL_SMTP_USER");
  const staffEmail = Deno.env.get("SEASONAL_STAFF_EMAIL");
  if (!password || !isSingleEmailAddress(mailbox) || !isSingleEmailAddress(staffEmail))
    return reply(503, { error: "Email configuration unavailable" });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );
  const transport = nodemailer.createTransport({
    host: "smtp.mail.yahoo.com",
    port: 465,
    secure: true,
    auth: { user: mailbox, pass: password },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    disableFileAccess: true,
    disableUrlAccess: true,
    tls: { minVersion: "TLSv1.2" }
  });
  try {
    // Check credentials before claiming jobs so setup failures don't consume retries.
    await transport.verify();
  } catch {
    return reply(503, {
      error: "Email connection unavailable; registrations remain queued"
    });
  }
  try {
    const { data: jobs, error } = await db.rpc("claim_seasonal_registration_mail");
    if (error) return reply(500, { error: "Unable to claim queued emails" });
    let accepted = 0;
    for (const job of jobs ?? []) {
      let outcome = "accepted";
      let errorCode: string | null = null;
      try {
        const { reply_to, ...message } = buildRegistrationEmail(
          job.registration,
          job.kind,
          {
            from: `Inferno Hot Pilates <${mailbox}>`,
            staffEmail
          }
        );
        await transport.sendMail({
          ...message,
          from: { name: "Inferno Hot Pilates", address: mailbox },
          to: { address: message.to },
          replyTo: { address: reply_to },
          envelope: { from: mailbox, to: [message.to] },
          messageId: `<seasonal-${job.id}@yahoo.com>`
        });
      } catch (error) {
        const smtp = error as {
          code?: string;
          responseCode?: number;
          command?: string;
        };
        errorCode = smtp.responseCode ? `smtp_${smtp.responseCode}` : "smtp_connection";
        // Explicit SMTP rejections are safe to retry. Lost responses after DATA
        // are held for review because Yahoo may already have accepted the email.
        if (error instanceof TypeError) {
          outcome = "failed";
          errorCode = "invalid_recipient";
        } else if (smtp.responseCode)
          outcome = smtp.responseCode < 500 ? "retry" : "failed";
        else if (
          [
            "CONN",
            "EHLO",
            "HELO",
            "AUTH PLAIN",
            "AUTH LOGIN",
            "MAIL FROM",
            "RCPT TO"
          ].includes(smtp.command ?? "")
        )
          outcome = "retry";
        else outcome = "uncertain";
      }
      const { data: finished, error: finishError } = await db.rpc(
        "finish_seasonal_registration_mail",
        {
          job_id: job.id,
          token: job.lease_token,
          outcome,
          error_code: errorCode
        }
      );
      if (finishError || !finished)
        return reply(500, { error: "Email state needs review" });
      if (outcome === "accepted") accepted++;
    }
    return reply(200, { processed: jobs?.length ?? 0, accepted });
  } catch {
    return reply(500, {
      error: "Email processing interrupted; saved registrations are safe"
    });
  } finally {
    transport.close();
  }
});
