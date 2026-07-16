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

export default function TailorWorkspace({ bullets = defaultBullets, coverLetter = defaultLetter, score = 87 }) {
  const [copied, setCopied] = useState("");

  async function copyText(key, text) {
    await navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div className="page page-scroll tailoring-page">
      <div className="sticky-title">
        <div>
          <p className="eyebrow"><Icon name="briefcase" />Senior Product Designer at TechNova</p>
          <h2>Tailored Application</h2>
        </div>
        <div className="button-row">
          <button className="outline-button"><Icon name="history" />Version History</button>
          <button className="gold-button"><Icon name="download" />Export to PDF</button>
        </div>
      </div>
      <section className="summary-card">
        <div className="mini-score">{score}</div>
        <div>
          <h3>Match Score Improved</h3>
          <p>Applied role-specific keywords, stronger metrics, and clearer leadership framing.</p>
        </div>
        <span className="pill good">+15 points</span>
      </section>
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
    </div>
  );
}
