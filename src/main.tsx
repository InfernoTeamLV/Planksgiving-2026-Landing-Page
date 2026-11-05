import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function getAppUrl() {
  const value = import.meta.env.VITE_APP_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const appUrl = getAppUrl();
const features = [
  [
    "01",
    "Show up with a plan.",
    "Find your daily programming in one place. Spend less time figuring out what’s next and more time moving."
  ],
  [
    "02",
    "Keep your progress close.",
    "Record your performance and revisit your personal bests. Build a picture of your training, session by session."
  ],
  [
    "03",
    "Stay connected to your coach.",
    "A shared home for members and coaches, with training and member information right where it belongs."
  ]
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header wrap">
        <a className="brand" href="#" aria-label="TNT home">
          <span className="brand-mark">
            tnt<span>↗</span>
          </span>
          <span className="brand-caption">
            BY INFERNO
            <br />
            HOT PILATES
          </span>
        </a>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav
          id="navigation"
          className={menuOpen ? "navigation open" : "navigation"}
          aria-label="Main navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#approach">The approach</a>
          <a href="#training">Your training</a>
          <a className="nav-cta" href={appUrl ?? "#get-started"}>
            Member access <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> A LITTLE INTENTION. A LOT OF POTENTIAL.
            </p>
            <h1 id="hero-title">
              Make every
              <br />
              session <em>count.</em>
            </h1>
            <p className="intro">
              Your training deserves a home. Meet TNT: daily programming, personal
              progress, and the motivation to keep coming back.
            </p>
            <a className="button" href={appUrl ?? "#get-started"}>
              Find your momentum <span aria-hidden="true">↗</span>
            </a>
            <p className="hero-note">Built for the way you train.</p>
          </div>
          <div
            className="training-art"
            role="img"
            aria-label="Illustration of a training journal with workout and progress cards"
          >
            <div className="art-grid" />
            <span className="art-label">THE WORK ADDS UP.</span>
            <span className="giant-type" aria-hidden="true">
              GO
              <br />
              <i>ALL IN.</i>
            </span>
            <div className="workout-card">
              <div className="card-top">
                <span>YOUR TRAINING JOURNAL</span>
                <span aria-hidden="true">↗</span>
              </div>
              <h2>
                One session
                <br />
                at a time.
              </h2>
              <div className="workout-row">
                <span className="check">✓</span>
                <span>Follow your programming</span>
              </div>
              <div className="workout-row">
                <span className="check">✓</span>
                <span>Log your performance</span>
              </div>
              <div className="workout-row">
                <span className="check">✓</span>
                <span>See how far you’ve come</span>
              </div>
              <div className="card-bottom">
                A STRONGER ROUTINE STARTS HERE <span>→</span>
              </div>
            </div>
            <div className="progress-tag">
              <span aria-hidden="true">↗</span>
              <div>
                YOUR PACE.
                <br />
                <strong>YOUR PROGRESS.</strong>
              </div>
            </div>
            <span className="art-footnote">
              A LOOK AT WHAT’S POSSIBLE · ILLUSTRATIVE PREVIEW
            </span>
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>MOVE WITH PURPOSE</span>
          <b>✳</b>
          <span>BUILD YOUR MOMENTUM</span>
          <b>✳</b>
          <span>MAKE IT YOURS</span>
          <b>✳</b>
          <span>MOVE WITH PURPOSE</span>
        </div>
        <section id="approach" className="approach wrap">
          <p className="eyebrow">LESS FRICTION. MORE FOCUS.</p>
          <div className="section-heading">
            <h2>
              A stronger routine.
              <br />
              From the inside out.
            </h2>
            <p>
              Good training is more than the work you put in. It’s knowing where you’re
              going, seeing what’s changing, and having support along the way.
            </p>
          </div>
          <div className="features">
            {features.map(([number, title, description]) => (
              <article key={number}>
                <span className="feature-number">/{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="training" className="training wrap">
          <div>
            <p className="eyebrow">A PLACE FOR YOUR PROGRESS</p>
            <h2>
              Your next session.
              <br />
              <em>Your bigger picture.</em>
            </h2>
          </div>
          <div className="training-details">
            <p>
              From daily programming to variation-specific performance, TNT brings the
              details of your training together.
            </p>
            <ul>
              <li>
                Daily workouts and programming <span>↗</span>
              </li>
              <li>
                Personal bests and progress <span>↗</span>
              </li>
              <li>
                Dedicated member and coach workspaces <span>↗</span>
              </li>
            </ul>
          </div>
        </section>
        <section id="get-started" className="start wrap">
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h2>
            Bring the effort.
            <br />
            We’ll bring the structure.
          </h2>
          {appUrl ? (
            <a className="button" href={appUrl}>
              Open the TNT app <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <p className="access-note">
              Member access will be linked here when this page launches.
              <br />
              Already training with Inferno? Ask your coach for your app link.
            </p>
          )}
        </section>
      </main>
      <footer className="footer wrap">
        <a className="brand-mark" href="#" aria-label="Back to top">
          tnt<span>↗</span>
        </a>
        <p>Inferno Hot Pilates · Training with intention.</p>
        <span>© {new Date().getFullYear()} TNT</span>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
