import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

const defaultBullets = [
  "Led end-to-end design for enterprise web and mobile applications, migrating workflows to Figma to establish a centralized Design System.",
  "Partnered with product and engineering to ship dashboard improvements that reduced review time by 28% across hiring operations.",
  "Mentored 4 junior designers through weekly critiques, improving delivery quality and stakeholder alignment.",
];

const defaultLetter = `Dear Hiring Team,

I am excited by TechNova's focus on scalable product systems. My recent work combines enterprise design leadership, measurable workflow improvement, and hands-on design system execution.

I would welcome the chance to bring that blend of product judgment and delivery discipline to your team.`;

export default function TailorWorkspace({ application, tailoredDoc, loading = false, onTailor, onExport, score = 87 }) {
  const [copied, setCopied] = useState("");
  const [activeDoc, setActiveDoc] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history helper
  const getHistoryKey = () => application ? `tailor_history_${application.id}` : null;

  const loadHistory = () => {
    const key = getHistoryKey();
    if (!key) return [];
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  };

  // Sync activeDoc with tailoredDoc prop
  useEffect(() => {
    setActiveDoc(tailoredDoc);
  }, [tailoredDoc]);

  // Sync history when application changes
  useEffect(() => {
    setHistory(loadHistory());
  }, [application]);

  // Auto-save new tailoredDoc to history
  useEffect(() => {
    if (!application || !tailoredDoc) return;
    const key = getHistoryKey();
    if (!key) return;

    const currentHistory = loadHistory();
    const latest = currentHistory[0];

    const isSame = latest &&
      latest.cover_letter === tailoredDoc.cover_letter &&
      JSON.stringify(latest.tailored_bullets) === JSON.stringify(tailoredDoc.tailored_bullets);

    if (!isSame) {
      const newVersion = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        cover_letter: tailoredDoc.cover_letter,
        tailored_bullets: tailoredDoc.tailored_bullets
      };
      const updated = [newVersion, ...currentHistory].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
      setHistory(updated);
    }
  }, [tailoredDoc, application]);

  const bullets = activeDoc?.tailored_bullets || defaultBullets;
  const coverLetter = activeDoc?.cover_letter || defaultLetter;

  async function copyText(key, text) {
    await navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1200);
  }

  function handleRestore(version) {
    setActiveDoc({
      tailored_bullets: version.tailored_bullets,
      cover_letter: version.cover_letter
    });
    setIsHistoryOpen(false);
  }

  function handleDeleteHistoryItem(id, e) {
    e.stopPropagation();
    const key = getHistoryKey();
    if (!key) return;
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setHistory(updated);
  }

  return (
    <div className="page page-scroll tailoring-page">
      <div className="sticky-title">
        <div>
          <p className="eyebrow"><Icon name="briefcase" />{application ? `${application.role} at ${application.company}` : "Senior Product Designer at TechNova"}</p>
          <h2>Tailored Application</h2>
        </div>
        <div className="button-row">
          <button className="outline-button" onClick={() => setIsHistoryOpen(true)}>
            <Icon name="history" />Version History
          </button>
          {tailoredDoc && (
            <button className="gold-button" onClick={onExport} disabled={loading}>
              <Icon name="download" />Export Docs
            </button>
          )}
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
            {coverLetter.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
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
              {bullets.map((bullet, index) => <p key={index}>{bullet}</p>)}
            </div>
          </article>
        </section>
      )}

      {isHistoryOpen && (
        <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="quick-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <h2>Version History</h2>
                <p>Select a previously generated version of this tailored application to view or restore.</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} aria-label="Close modal">
                <Icon name="x" />
              </button>
            </header>
            <div className="modal-body">
              {history.length === 0 ? (
                <div className="history-empty">
                  No previous versions found. Generations and regenerations are automatically versioned here.
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item) => {
                    const date = new Date(item.timestamp).toLocaleString();
                    const coverPreview = item.cover_letter ? item.cover_letter.slice(0, 100) + "..." : "";
                    const isCurrent = activeDoc &&
                      activeDoc.cover_letter === item.cover_letter &&
                      JSON.stringify(activeDoc.tailored_bullets) === JSON.stringify(item.tailored_bullets);

                    return (
                      <div key={item.id} className="history-item" onClick={() => handleRestore(item)} style={{ cursor: "pointer" }}>
                        <div className="history-info">
                          <div className="history-time" style={{ display: "flex", alignItems: "center" }}>
                            {date} {isCurrent && <span className="pill good" style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 6px", textTransform: "none" }}>Active</span>}
                          </div>
                          <div className="history-preview">
                            {coverPreview}
                          </div>
                        </div>
                        <div className="history-actions">
                          <button className="outline-button" onClick={() => handleRestore(item)}>
                            Restore
                          </button>
                          <button className="outline-button" style={{ color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.4)" }} onClick={(e) => handleDeleteHistoryItem(item.id, e)}>
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
