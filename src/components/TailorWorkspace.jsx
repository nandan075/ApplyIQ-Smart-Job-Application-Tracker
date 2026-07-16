import { useState } from "react";
import Icon from "./Icon.jsx";

const defaultBullets = [
  "Led end-to-end design for enterprise web and mobile applications, migrating workflows to Figma to establish a centralized Design System.",
  "Partnered with product and engineering to ship dashboard improvements that reduced review time by 28% across hiring operations.",
  "Mentored 4 junior designers through weekly critiques, improving delivery quality and stakeholder alignment.",
];

const defaultLetter = `Dear Hiring Team,

I am excited by TechNova's focus on scalable product systems. My recent work combines enterprise design leadership, measurable workflow improvement, and hands-on design system execution.

I would welcome the chance to bring that blend of product judgment and delivery discipline to your team.`;

export default function TailorWorkspace({ application, tailoredDoc, loading = false, onTailor, score = 87 }) {
  const [copied, setCopied] = useState("");
  const bullets = tailoredDoc?.tailored_bullets || defaultBullets;
  const coverLetter = tailoredDoc?.cover_letter || defaultLetter;

  async function copyText(key, text) {
    await navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div className="page page-scroll tailoring-page">
      <div className="sticky-title">
        <div>
          <p className="eyebrow"><Icon name="briefcase" />{application ? `${application.role} at ${application.company}` : "Senior Product Designer at TechNova"}</p>
          <h2>Tailored Application</h2>
        </div>
        <div className="button-row">
          <button className="outline-button"><Icon name="history" />Version History</button>
          <button className="gold-button" onClick={onTailor} disabled={loading || !application}>
            <Icon name={loading ? "loader" : "wand"} className={loading ? "spin" : ""} />
            {tailoredDoc ? "Regenerate" : "Generate"}
          </button>
        </div>
      </div>
      <section className="summary-card">
        <div className="mini-score">{score}</div>
        <div>
          <h3>{tailoredDoc ? "Tailored Docs Ready" : "Ready to Tailor"}</h3>
          <p>{tailoredDoc ? "Generated cover letter and modified bullet points from the saved resume." : "Generate role-specific materials after scoring the application."}</p>
        </div>
        <span className="pill good">{tailoredDoc ? "Saved" : "Pending"}</span>
      </section>
      {loading ? (
        <section className="tailor-workspace-grid processing-skeleton" aria-busy="true">
          <article className="panel workspace-panel skeleton-stack"><b /><span /><span /><span /><span /></article>
          <article className="panel workspace-panel skeleton-stack"><b /><span /><span /><span /><span /></article>
        </section>
      ) : (
        <section className="tailor-workspace-grid">
          <article className="panel letter-panel workspace-panel">
            <header>
              <h3><Icon name="mail" />Cover Letter Draft</h3>
              <button className="outline-button" onClick={() => copyText("letter", coverLetter)}>
                <Icon name={copied === "letter" ? "check" : "copy"} />
                {copied === "letter" ? "Copied" : "Copy"}
              </button>
            </header>
            {coverLetter.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
          <article className="panel workspace-panel">
            <header>
              <h3><Icon name="wand" />Modified Bullet Points</h3>
              <button className="outline-button" onClick={() => copyText("bullets", bullets.join("\n"))}>
                <Icon name={copied === "bullets" ? "check" : "copy"} />
                {copied === "bullets" ? "Copied" : "Copy"}
              </button>
            </header>
            <div className="bullet-list">
              {bullets.map((bullet) => <p key={bullet}>{bullet}</p>)}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
