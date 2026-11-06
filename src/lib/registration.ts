export type Registration = {
  fullName: string;
  email: string;
  phone: string;
  membership: "member" | "guest";
  ageConfirmed: boolean;
};
export type RegistrationErrors = Partial<Record<keyof Registration, string>>;

export function validateRegistration(input: Registration) {
  const errors: RegistrationErrors = {};
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  const rawPhone = input.phone.trim();
  const digits = rawPhone.replace(/\D/g, "");
  const phone = rawPhone.startsWith("+")
    ? `+${digits}`
    : digits.length === 10
      ? `+1${digits}`
      : `+${digits}`;
  if (fullName.length < 2 || fullName.length > 100)
    errors.fullName = fullName
      ? "Your full name should be between 2 and 100 characters."
      : "Enter your full name.";
  if (
    email.length > 254 ||
    email.split("@")[0].length > 64 ||
    /(^\.|\.$|\.\.)/.test(email.split("@")[0]) ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      email
    )
  )
    errors.email = email
      ? "Check that your email address is complete and valid."
      : "Enter your email address.";
  const validPhone =
    /^[+\d\s().-]+$/.test(rawPhone) &&
    (rawPhone.startsWith("+")
      ? /^[1-9]\d{7,14}$/.test(digits)
      : digits.length === 10 || (digits.length === 11 && digits.startsWith("1")));
  if (!validPhone)
    errors.phone = rawPhone
      ? "Check your phone number: use 10 digits, or include + and your country code."
      : "Enter your phone number.";
  if (!["member", "guest"].includes(input.membership))
    errors.membership = "Choose member or guest.";
  if (input.ageConfirmed !== true)
    errors.ageConfirmed = "Confirm that you are 18 years of age or older.";
  return { errors, value: { ...input, fullName, email, phone } };
}

export async function submitRegistration(
  value: Registration,
  endpoint: string | undefined,
  request: typeof fetch = fetch,
  publishableKey?: string
) {
  if (!endpoint?.trim())
    throw new Error(
      "Registration is not available yet. Your details have not been sent. Please try again later."
    );
  let response: Response;
  try {
    response = await request(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...(publishableKey ? { apikey: publishableKey } : {})
      },
      body: JSON.stringify({
        form_key: "planksgiving-2026",
        full_name: value.fullName,
        email: value.email,
        phone: value.phone,
        membership: value.membership,
        age_confirmed: value.ageConfirmed
      }),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    throw new Error(
      "We couldn’t confirm your registration. Check your connection and try again. Your details are still here."
    );
  }
  if (response.status === 409)
    throw new Error(
      "This email is already registered for Planksgiving. Contact the Inferno team if you need to update your details."
    );
  if (response.status === 429)
    throw new Error(
      "We’re receiving too many registration attempts. Please try again later or contact the Inferno team."
    );
  if (response.status === 400 || response.status === 403)
    throw new Error(
      "Registration is currently unavailable, or these details could not be accepted. Please check your information and contact the Inferno team if this continues."
    );
  if (!response.ok)
    throw new Error(
      "We couldn’t save your registration. Please try again. Your details are still here."
    );
  // PostgREST confirms a committed insert with 201 and return=minimal.
  if (response.status === 201) return;
  const result = await response.json().catch(() => null);
  if (result?.ok !== true)
    throw new Error(
      "We couldn’t confirm your registration. Please try again or contact the Inferno team."
    );
}
