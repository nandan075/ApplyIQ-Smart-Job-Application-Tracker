import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "relevance", label: "Relevance", icon: "fact_check" },
  { id: "tailoring", label: "Tailoring", icon: "auto_fix_high" },
  { id: "tracker", label: "Tracker", icon: "view_kanban" },
];

function Icon({ name, filled = false }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {name}
    </span>
  );
}

function Shell({ activePage, setActivePage, openQuickAdd, children }) {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-block">
          <div className="brand-mark">AIQ</div>
          <div>
            <h1>ApplyIQ</h1>
            <p>Career Assistant</p>
          </div>
        </div>
        <button className="primary-side-button" onClick={openQuickAdd}>
          <Icon name="add" filled />
          New Application
        </button>
        <nav className="nav-links">
          {pages.map((page) => (
            <button
              key={page.id}
              className={activePage === page.id ? "active" : ""}
              onClick={() => setActivePage(page.id)}
            >
              <Icon name={page.icon} filled={activePage === page.id} />
              {page.label}
            </button>
          ))}
        </nav>
        <div className="nav-footer">
          <button><Icon name="settings" />Settings</button>
          <button><Icon name="help_outline" />Help</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="mobile-header">
          <strong>ApplyIQ</strong>
          <button onClick={openQuickAdd}><Icon name="add" /></button>
        </header>
        {children}
      </main>
    </div>
  );
}

function Dashboard({ openQuickAdd, setActivePage }) {
  const stats = [
    { label: "Saved", value: "12", icon: "bookmark_border" },
    { label: "Applied", value: "45", icon: "send", filled: true },
    { label: "Interviewing", value: "3", icon: "forum", featured: true },
    { label: "Offers", value: "1", icon: "star" },
  ];

  const analyses = [
    { role: "Senior Frontend Engineer", company: "Orbital Labs", score: 82, note: "React, AWS, and mentoring keywords matched." },
    { role: "Product Designer", company: "TechNova Solutions", score: 87, note: "Design system and Figma experience improved." },
    { role: "UX Engineer", company: "Atlas AI", score: 76, note: "Add stronger metrics around prototype impact." },
  ];

  return (
    <div className="page dashboard-page">
      <div className="page-title-row">
        <div>
          <h2>Welcome back, Alex.</h2>
          <p>Let's keep the momentum going on your applications.</p>
        </div>
      </div>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className={`stat-card ${stat.featured ? "featured" : ""}`} key={stat.label}>
            <div className="stat-orb" />
            <Icon name={stat.icon} filled={stat.filled} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="quick-card">
            <div>
              <h3><Icon name="bolt" />Fast-Track Application</h3>
              <p>Found a great role? Paste the URL or job description here to instantly generate a tailored resume and score.</p>
            </div>
            <button className="gold-button" onClick={openQuickAdd}>
              <Icon name="add" />
              Quick Add
            </button>
          </section>

          <section>
            <div className="section-title-row">
              <h3>Recent Analysis</h3>
              <button onClick={() => setActivePage("relevance")}>View All</button>
            </div>
            <div className="analysis-feed">
              {analyses.map((item) => (
                <article className="analysis-card" key={`${item.company}-${item.role}`}>
                  <div className="company-logo">{item.company.slice(0, 1)}</div>
                  <div>
                    <h4>{item.role}</h4>
                    <p>{item.company}</p>
                    <span>{item.note}</span>
                  </div>
                  <strong>{item.score}%</strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-side">
          <section className="task-card">
            <h3>Upcoming Tasks</h3>
            <ul>
              <li><b />Follow up with Nova<span>Today</span></li>
              <li><b />Prep BrightDesk notes<span>Tomorrow</span></li>
              <li><b />Submit TechNova draft<span>Fri</span></li>
            </ul>
            <button className="outline-button" onClick={() => setActivePage("tracker")}>Open Tracker</button>
          </section>

          <section className="tip-card">
            <Icon name="tips_and_updates" />
            <h3>Optimizer Tip</h3>
            <p>Tailoring your resume to match specific keywords increases interview chances. Run your latest draft through the optimizer.</p>
            <button onClick={() => setActivePage("tailoring")}>Optimize Now</button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function RelevanceChecker() {
  const [jd, setJd] = useState("We need a senior frontend engineer with React, Node.js, AWS, mentoring, GraphQL APIs, and measurable product impact.");
  const hasInput = jd.trim().length > 12;

  return (
    <div className="page page-scroll">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Resume Optimizer</p>
          <h2>Relevance Checker</h2>
          <p>Upload your resume and paste a job description to compare fit.</p>
        </div>
        <button className="icon-square"><Icon name="more_horiz" /></button>
      </div>

      <section className="input-grid">
        <div className="panel upload-panel">
          <div className="panel-heading">
            <span className="round-icon"><Icon name="description" /></span>
            <h3>Your Resume</h3>
          </div>
          <label className="drop-zone">
            <Icon name="upload_file" />
            <strong>Drag & Drop Resume</strong>
            <span>Supports PDF, DOCX, TXT (Max 5MB)</span>
            <input type="file" accept=".pdf,.doc,.docx,.txt" />
            <b>Browse Files</b>
          </label>
        </div>

        <div className="panel jd-panel">
          <div className="panel-heading">
            <span className="round-icon"><Icon name="work" /></span>
            <h3>Job Description</h3>
          </div>
          <textarea
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            placeholder="Paste the full job description here to analyze relevance..."
          />
        </div>
      </section>

      <section className="panel score-panel">
        <div className="score-gauge-wrap">
          <h3>Relevance Score</h3>
          <div className="score-gauge">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
              <circle className="progress" cx="50" cy="50" r="45" pathLength="100" strokeDasharray={`${hasInput ? 72 : 18} 100`} />
            </svg>
            <div><strong>{hasInput ? 72 : 18}%</strong><span>{hasInput ? "Strong Match" : "Needs Input"}</span></div>
          </div>
        </div>
        <div className="score-details">
          <AnalysisList title="Matched Strengths" icon="check_circle" tone="good" items={[
            "5+ years of React/Node.js experience strongly aligned.",
            "Leadership and agile mentoring clearly demonstrated.",
            "Cloud infrastructure (AWS) keywords match exactly."
          ]} />
          <AnalysisList title="Drawbacks & Gaps" icon="warning" tone="warn" items={[
            "Missing specific mentions of GraphQL APIs.",
            "Recent product metrics could be more quantified."
          ]} />
          <div className="suggestions">
            <h4><Icon name="lightbulb" />Actionable Suggestions</h4>
            <ul>
              <li>Add measurable outcomes to the last two roles.</li>
              <li>Mirror the posting language around GraphQL and platform work.</li>
              <li>Move AWS project ownership into the top third of the resume.</li>
              <li>Make mentoring impact visible with team size and cadence.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="right-actions">
        <button className="gold-button"><Icon name="magic_button" />Generate Tailored Resume</button>
      </div>
    </div>
  );
}

function AnalysisList({ title, icon, tone, items }) {
  return (
    <div className="analysis-list">
      <h4 className={tone}><Icon name={icon} />{title}</h4>
      <ul>
        {items.map((item) => <li key={item}><Icon name={tone === "good" ? "task_alt" : "error"} />{item}</li>)}
      </ul>
    </div>
  );
}

const initialDiffs = [
  {
    id: 1,
    original: "Designed enterprise web and mobile applications and supported workflow updates for design teams.",
    suggested: "Led end-to-end design for enterprise web and mobile applications, migrating workflows to Figma to establish a centralized Design System."
  },
  {
    id: 2,
    original: "Worked with product and engineering to ship dashboard improvements.",
    suggested: "Partnered with product and engineering to ship dashboard improvements that reduced review time by 28% across hiring operations."
  },
  {
    id: 3,
    original: "Helped junior designers and reviewed design work.",
    suggested: "Mentored 4 junior designers through weekly critiques, improving delivery quality and stakeholder alignment."
  }
];

function TailoringScreen() {
  const [tab, setTab] = useState("resume");
  const [diffs, setDiffs] = useState(initialDiffs.map((item) => ({ ...item, state: "pending" })));
  const [editing, setEditing] = useState(null);

  const updateDiff = (id, patch) => setDiffs((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));

  return (
    <div className="page page-scroll tailoring-page">
      <div className="sticky-title">
        <div>
          <p className="eyebrow"><Icon name="business_center" />Senior Product Designer at TechNova</p>
          <h2>Tailored Application</h2>
        </div>
        <div className="button-row">
          <button className="outline-button"><Icon name="history" />Version History</button>
          <button className="gold-button"><Icon name="download" />Export to PDF</button>
        </div>
      </div>
      <div className="tabs">
        <button className={tab === "resume" ? "active" : ""} onClick={() => setTab("resume")}><Icon name="description" />Resume</button>
        <button className={tab === "letter" ? "active" : ""} onClick={() => setTab("letter")}><Icon name="drafts" />Cover Letter</button>
      </div>
      <section className="summary-card">
        <div className="mini-score">87</div>
        <div>
          <h3>Match Score Improved</h3>
          <p>Applied role-specific keywords, stronger metrics, and clearer leadership framing.</p>
        </div>
        <span className="pill good">+15 points</span>
      </section>
      {tab === "resume" ? (
        <section>
          <h3 className="section-heading"><Icon name="work_history" />Work Experience</h3>
          <div className="diff-list">
            {diffs.map((item) => (
              <div className={`diff-row ${item.state}`} key={item.id}>
                <div>
                  <span className="diff-label">Original</span>
                  <p>{item.original}</p>
                </div>
                <div>
                  <span className="diff-label suggested">Suggested Improvement</span>
                  {editing === item.id ? (
                    <textarea value={item.suggested} onChange={(event) => updateDiff(item.id, { suggested: event.target.value })} />
                  ) : (
                    <p><mark>{item.suggested.split(" ").slice(0, 4).join(" ")}</mark>{item.suggested.includes(" ") ? ` ${item.suggested.split(" ").slice(4).join(" ")}` : ""}</p>
                  )}
                </div>
                <div className="diff-actions">
                  <button title="Accept" onClick={() => updateDiff(item.id, { state: "accepted" })}><Icon name="check" /></button>
                  <button title="Reject" onClick={() => updateDiff(item.id, { state: "rejected" })}><Icon name="close" /></button>
                  <button title="Edit" onClick={() => setEditing(editing === item.id ? null : item.id)}><Icon name="edit" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="panel letter-panel">
          <h3>Cover Letter Draft</h3>
          <p>Dear Hiring Team, I am excited by TechNova's focus on scalable product systems. My recent work combines enterprise design leadership, measurable workflow improvement, and hands-on design system execution.</p>
          <p>I would welcome the chance to bring that blend of product judgment and delivery discipline to your team.</p>
        </section>
      )}
    </div>
  );
}

const boardSeed = {
  saved: [
    { id: "a", company: "Orbital Labs", role: "Frontend Engineer", score: 82, meta: "Added 2d ago", tag: "Remote" },
    { id: "b", company: "Luma Health", role: "Product Designer", score: 76, meta: "Saved today", tag: "Hybrid" },
    { id: "c", company: "Atlas AI", role: "UX Engineer", score: 91, meta: "Added 4d ago", tag: "Series B" }
  ],
  applied: [
    { id: "d", company: "Nova", role: "Senior PM", score: 68, meta: "Waiting 7 days. Consider a follow-up.", tag: "Follow-up" },
    { id: "e", company: "HelioWorks", role: "Design Lead", score: 84, meta: "Applied yesterday", tag: "Referral" }
  ],
  interview: [
    { id: "f", company: "BrightDesk", role: "Staff Designer", score: 89, meta: "Screen tomorrow 10:30 AM", tag: "Prep Notes" }
  ],
  offer: [
    { id: "g", company: "Summit Bank", role: "Product Manager", score: 71, meta: "Offer received", tag: "Done" }
  ]
};

const columnMeta = [
  ["saved", "Saved"],
  ["applied", "Applied"],
  ["interview", "Interviewing"],
  ["offer", "Offers / Done"]
];

function TrackerScreen() {
  const [board, setBoard] = useState(boardSeed);
  const [dragging, setDragging] = useState(null);
  const [alertVisible, setAlertVisible] = useState(true);

  function moveCard(target) {
    if (!dragging || dragging.from === target) return;
    const card = board[dragging.from].find((item) => item.id === dragging.id);
    setBoard((current) => ({
      ...current,
      [dragging.from]: current[dragging.from].filter((item) => item.id !== dragging.id),
      [target]: [...current[target], card]
    }));
    setDragging(null);
  }

  return (
    <div className="tracker-page">
      {alertVisible && (
        <div className="follow-alert">
          <Icon name="notifications_active" />
          <p><strong>Follow-up Alert:</strong> No response from <span>Nova</span> in 7 days. Draft a check-in?</p>
          <button onClick={() => setAlertVisible(false)}>Draft Message</button>
        </div>
      )}
      <div className="tracker-header">
        <div>
          <h2>Application Tracker</h2>
          <p>Drag and drop to update status.</p>
        </div>
        <div className="search-box"><Icon name="search" /><input placeholder="Search roles..." /></div>
        <button className="icon-square"><Icon name="filter_list" /></button>
      </div>
      <div className="kanban">
        {columnMeta.map(([key, label]) => (
          <section
            className={`kanban-column ${dragging ? "drop-ready" : ""}`}
            key={key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveCard(key)}
          >
            <header>
              <h3>{label} <span>{board[key].length}</span></h3>
              <button><Icon name="add" /></button>
            </header>
            <div className="kanban-list">
              {board[key].map((card) => (
                <article
                  draggable
                  className="job-card"
                  key={card.id}
                  onDragStart={() => setDragging({ id: card.id, from: key })}
                  onDragEnd={() => setDragging(null)}
                >
                  <Icon name="drag_indicator" />
                  <div className="company-logo">{card.company.slice(0, 1)}</div>
                  <div>
                    <h4>{card.role}</h4>
                    <p>{card.company}</p>
                  </div>
                  <div className="card-footer">
                    <span className="pill">{card.score}% match</span>
                    <span>{card.meta}</span>
                  </div>
                  <button className="tiny-action">{card.tag}</button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function QuickAddModal({ open, onClose }) {
  const [text, setText] = useState("");
  const extracted = text.trim().length > 10;

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
        <header>
          <div>
            <h2 id="quick-add-title">Quick Add Job</h2>
            <p>Paste a URL or description to auto-extract details.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal"><Icon name="close" /></button>
        </header>
        <div className="modal-body">
          <label>Job URL or Description</label>
          <div className="source-input">
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the job posting URL or the full job description here..." />
            <button aria-label="Extract Details"><Icon name="auto_awesome" /></button>
          </div>
          <div className="extracted-grid">
            {!extracted && <div className="waiting-pill"><Icon name="sync" />Waiting for input...</div>}
            <Field label="Role" value={extracted ? "Senior Product Designer" : ""} />
            <Field label="Company" value={extracted ? "TechNova Solutions" : ""} />
            <Field label="Deadline" value="2026-08-15" type="date" />
            <Field label="Location" value={extracted ? "Remote, US" : ""} />
          </div>
          <div className="live-score">
            <div>
              <h3>Live Relevance Score</h3>
              <p>{extracted ? "Strong match based on portfolio keywords." : "Paste a job source to calculate fit."}</p>
            </div>
            <strong>{extracted ? 87 : 0}%</strong>
            <div className="score-bar"><span style={{ width: `${extracted ? 87 : 0}%` }} /></div>
          </div>
        </div>
        <footer>
          <button className="outline-button">Save to Tracker</button>
          <button className="gold-button">Generate Tailored Materials <Icon name="arrow_forward" /></button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value, type = "text" }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} readOnly />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const screen =
    activePage === "dashboard" ? (
      <Dashboard openQuickAdd={() => setModalOpen(true)} setActivePage={setActivePage} />
    ) : activePage === "tailoring" ? (
      <TailoringScreen />
    ) : activePage === "tracker" ? (
      <TrackerScreen />
    ) : (
      <RelevanceChecker />
    );

  return (
    <Shell activePage={activePage} setActivePage={setActivePage} openQuickAdd={() => setModalOpen(true)}>
      {screen}
      <QuickAddModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Shell>
  );
}

createRoot(document.getElementById("root")).render(<App />);
