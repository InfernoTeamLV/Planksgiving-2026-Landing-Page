import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { submitRegistration, validateRegistration } from "./lib/registration";
import type { RegistrationErrors } from "./lib/registration";
import type { FormEvent } from "react";
import "@fontsource/barlow-condensed/latin-800-italic.css";
import "./styles.css";

const faqs = [
  ["Is there an age requirement?", "Yes, participants must be 18 years or older."],
  [
    "Do I need to complete a waiver?",
    <>
      Yes, non-members need waivers.{" "}
      <a
        href="https://infernopilates.com/client-intake-form"
        target="_blank"
        rel="noopener noreferrer"
      >
        Fill out your waiver in advance.
      </a>
    </>
  ],
  [
    "What to bring?",
    "Bring a mat, a towel, and a water bottle to stay hydrated. Come ready to hold strong with your Inferno community."
  ]
];

function Arrow() {
  return (
    <span aria-hidden="true" className="arrow">
      ⟶
    </span>
  );
}

function NoticeIcon() {
  return (
    <svg
      className="notice-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" strokeLinecap="round" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function EventIcon({ type }: { type: "calendar" | "clock" | "location" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "calendar" ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v5M17 3v5M3 10h18M8 14h3v4" />
        </>
      ) : type === "clock" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v6l4 2" />
        </>
      ) : (
        <>
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
    </svg>
  );
}

function Header() {
  return (
    <header className="header content">
      <a
        className="brand"
        href="https://infernopilates.com/home-2509"
        aria-label="Inferno Hot Pilates home"
      >
        <img
          src="/images/inferno-logo-transparent.webp"
          alt=""
          width="104"
          height="104"
        />
      </a>
      <nav id="navigation" className="navigation" aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#faq">FAQ</a>
        <a className="button small" href="#registration">
          Register
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="hero-message">
          <p className="eyebrow hero-eyebrow">
            A COMMUNITY PLANK CHALLENGE <span />
          </p>
          <h1 id="hero-title">PLANKSGIVING.</h1>
          <h2>HOW LONG CAN YOU HOLD?</h2>
          <p className="hero-intro">
            One plank. One challenge. See what you’re capable of.
          </p>
        </div>
        <div className="event-facts">
          <div>
            <EventIcon type="calendar" />
            <time dateTime="2026-11-26T07:00:00-08:00">
              Thursday,
              <br />
              <span className="event-date-full">November 26, 2026</span>
              <span className="event-date-compact">Nov 26, 2026</span>
            </time>
          </div>
          <div>
            <EventIcon type="clock" />
            <span>7:00 AM</span>
          </div>
          <div>
            <EventIcon type="location" />
            <span className="event-location">
              9130 W Russell Rd #110
              <br />
              Las Vegas, NV 89148
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <a className="button" href="#registration">
            COUNT ME IN <Arrow />
          </a>
        </div>
      </div>
      <div className="hero-art">
        {imageFailed ? (
          <div className="mascot-fallback">
            ONE PLANK.
            <br />
            ALL HEART.
          </div>
        ) : (
          <img
            className="turkey"
            src="/images/planksgiving-turkey.webp"
            alt="A determined turkey in a teal headband holding a forearm plank"
            width="444"
            height="444"
            fetchPriority="high"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about-inner content">
        <div className="about-heading">
          <p className="eyebrow">THE CHALLENGE</p>
          <h2 id="about-title" className="display">
            STAY LOW.
            <br />
            HOLD STRONG.
          </h2>
          <span className="heading-rule" />
        </div>
        <div className="about-copy">
          <p>
            Planksgiving is your chance to put your strength and endurance to the test.
          </p>
          <p>
            Whether you’re here to challenge yourself or see how long you can last, it’s
            all about personal progress, showing up, and being part of the Inferno
            community.
          </p>
        </div>
      </div>
    </section>
  );
}

function RegistrationConfirmation({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="registration-confirmation"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onClose={onClose}
    >
      <button
        type="button"
        className="confirmation-close"
        aria-label="Close confirmation"
        onClick={() => dialog.current?.close()}
      >
        ×
      </button>
      <div className="confirmation-check" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 12 4 4 8-8" />
        </svg>
      </div>
      <p className="eyebrow">YOU’RE IN.</p>
      <h2 id="confirmation-title" className="display">
        ONE COMMUNITY.
        <br />
        ONE STRONG HOLD.
      </h2>
      <p id="confirmation-description">
        Your Planksgiving registration is saved. Bring your energy, find your spot, and
        see how long you can hold.
      </p>
      <div className="confirmation-event">
        <EventIcon type="calendar" />
        <div>
          <strong>Thursday, November 26 · 7:00 AM</strong>
          <span>9130 W Russell Rd #110 · Las Vegas, NV 89148</span>
        </div>
      </div>
      <p className="confirmation-entry">We look forward to holding strong together.</p>
      <button type="button" className="button" onClick={() => dialog.current?.close()}>
        LET’S HOLD STRONG
      </button>
      <p className="confirmation-motto">BURN. LOVE. TRANSFORM.</p>
    </dialog>
  );
}

function Registration() {
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [submissionError, setSubmissionError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fieldIds = {
    fullName: "full-name",
    email: "email",
    phone: "phone",

    ageConfirmed: "age-confirmation"
  };
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const { errors: nextErrors, value } = validateRegistration({
      fullName: String(fields.get("fullName") ?? ""),
      email: String(fields.get("email") ?? ""),
      phone: String(fields.get("phone") ?? ""),

      ageConfirmed: fields.get("ageConfirmed") === "on"
    });
    setErrors(nextErrors);
    setSubmissionError("");
    if (Object.keys(nextErrors).length) {
      const ids = {
        fullName: "full-name",
        email: "email",
        phone: "phone",

        ageConfirmed: "age-confirmation"
      };
      document
        .getElementById(ids[Object.keys(nextErrors)[0] as keyof typeof ids])
        ?.focus();
      return;
    }
    setPending(true);
    try {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
      const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
      await submitRegistration(
        value,
        projectUrl && publicKey
          ? `${projectUrl}/rest/v1/tnt_seasonal_form_submissions`
          : undefined,
        fetch,
        publicKey
      );
      setComplete(true);
      setShowConfirmation(true);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      id="registration"
      className="registration"
      aria-labelledby="registration-title"
    >
      <div className="registration-grid content">
        <div className="registration-copy">
          <p className="eyebrow">REGISTRATION</p>
          <h2 id="registration-title" className="display">
            JOIN THE CHALLENGE.
          </h2>
          <p className="registration-intro">One community. One challenge. One Hold.</p>
        </div>
        {complete ? (
          <div className="registration-preview registration-success" role="status">
            <p className="eyebrow">YOU’RE REGISTERED</p>
            <h3>See you at Planksgiving.</h3>
            <p>Your registration has been saved for November 26 at 7:00 AM.</p>
            <p>We look forward to holding strong together.</p>
            <button
              type="button"
              className="button confirmation-reopen"
              onClick={() => setShowConfirmation(true)}
            >
              VIEW CONFIRMATION
            </button>
          </div>
        ) : (
          <form
            className="registration-preview"
            aria-labelledby="registration-title"
            aria-busy={pending}
            noValidate
            onSubmit={handleSubmit}
            onChange={(event) => {
              setSubmissionError("");
              if (!(event.target instanceof HTMLInputElement)) return;
              const name = event.target.name as keyof RegistrationErrors;
              if (errors[name]) {
                const fields = new FormData(event.currentTarget);
                const checked = validateRegistration({
                  fullName: String(fields.get("fullName") ?? ""),
                  email: String(fields.get("email") ?? ""),
                  phone: String(fields.get("phone") ?? ""),

                  ageConfirmed: fields.get("ageConfirmed") === "on"
                });
                setErrors((previous) => ({
                  ...previous,
                  [name]: checked.errors[name]
                }));
              }
            }}
          >
            {(Object.values(errors).some(Boolean) || submissionError) && (
              <div className="validation-notice" role="alert">
                <NoticeIcon />
                <div>
                  <strong>A quick check</strong>
                  {Object.values(errors).some(Boolean) && (
                    <>
                      <p>Please check the following before registering:</p>
                      <ul>
                        {Object.entries(errors)
                          .filter(([, message]) => Boolean(message))
                          .map(([field, message]) => (
                            <li key={field} id={`${field}-error`}>
                              <a
                                href={`#${fieldIds[field as keyof typeof fieldIds]}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  document
                                    .getElementById(
                                      fieldIds[field as keyof typeof fieldIds]
                                    )
                                    ?.focus();
                                }}
                              >
                                {message}
                              </a>
                            </li>
                          ))}
                      </ul>
                    </>
                  )}
                  {submissionError && <p>{submissionError}</p>}
                </div>
              </div>
            )}
            <fieldset disabled={pending}>
              <legend className="sr-only">Register for Planksgiving</legend>
              <label htmlFor="full-name">
                Full Name <span>*</span>
              </label>
              <input
                id="full-name"
                name="fullName"
                required
                maxLength={100}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
              />
              <label htmlFor="email">
                Email Address <span>*</span>
              </label>
              <input
                id="email"
                name="email"
                required
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <label htmlFor="phone">
                Phone Number <span>*</span>
              </label>
              <input
                id="phone"
                name="phone"
                required
                maxLength={40}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                type="tel"
                placeholder="(702) 555-0123"
                autoComplete="tel"
              />
              <label className="age-option">
                <input
                  type="checkbox"
                  name="ageConfirmed"
                  id="age-confirmation"
                  required
                  aria-invalid={Boolean(errors.ageConfirmed)}
                  aria-describedby={
                    errors.ageConfirmed ? "ageConfirmed-error" : undefined
                  }
                />
                I confirm that I am 18 years of age or older. <span>*</span>
              </label>
              <button
                type="submit"
                className="button registration-button"
                disabled={pending}
              >
                {pending ? "REGISTERING…" : "REGISTER FOR PLANKSGIVING"} <Arrow />
              </button>
            </fieldset>
          </form>
        )}
      </div>
      {showConfirmation && (
        <RegistrationConfirmation onClose={() => setShowConfirmation(false)} />
      )}
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="faq" aria-labelledby="faq-title">
      <div className="faq-inner content">
        <div className="faq-heading">
          <p className="eyebrow">YOUR QUESTIONS, ANSWERED</p>
          <h2 id="faq-title" className="display">
            FAQ
          </h2>
          <span className="heading-rule" />
          <p className="faq-intro">
            Answers to common questions about joining Planksgiving.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => (
            <details key={index}>
              <summary>
                {question}
                <span className="faq-symbol" aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main">
        <div className="opening">
          <Header />
          <Hero />
        </div>
        <Registration />
        <About />
        <FAQ />
        <section className="closing" aria-labelledby="closing-title">
          <div className="content">
            <h2 id="closing-title" className="display">
              A STRONGER COMMUNITY
              <br />
              HOLDS TOGETHER.
            </h2>
            <a className="button" href="#registration">
              COUNT ME IN <Arrow />
            </a>
            <p className="closing-motto">
              <span />
              BURN. LOVE. TRANSFORM.
              <span />
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
