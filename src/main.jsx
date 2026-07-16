import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import Icon from "./components/Icon.jsx";
import JDInput from "./components/JDInput.jsx";
import MatchDashboard from "./components/MatchDashboard.jsx";
import ResumeUpload from "./components/ResumeUpload.jsx";
import TailorWorkspace from "./components/TailorWorkspace.jsx";
import TrackerBoard from "./components/TrackerBoard.jsx";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "relevance", label: "Relevance", icon: "checkCircle" },
  { id: "tailoring", label: "Tailoring", icon: "wand" },
  { id: "tracker", label: "Tracker", icon: "clipboard" },
];

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
          <Icon name="plus" />
          New Application
        </button>
        <nav className="nav-links">
          {pages.map((page) => (
            <button
              key={page.id}
              className={activePage === page.id ? "active" : ""}
              onClick={() => setActivePage(page.id)}
            >
              <Icon name={page.icon} />
              {page.label}
            </button>
          ))}
        </nav>
        <div className="nav-footer">
          <button><Icon name="settings" />Settings</button>
          <button><Icon name="help" />Help</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="mobile-header">
          <strong>ApplyIQ</strong>
          <button onClick={openQuickAdd}><Icon name="plus" /></button>
        </header>
        {children}
      </main>
    </div>
  );
}

function Dashboard({ openQuickAdd, setActivePage }) {
  const stats = [
    { label: "Saved", value: "12", icon: "bookmark" },
    { label: "Applied", value: "45", icon: "applied" },
    { label: "Interviewing", value: "3", icon: "mail", featured: true },
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
            <Icon name={stat.icon} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="quick-card">
            <div>
              <h3><Icon name="sparkles" />Fast-Track Application</h3>
              <p>Found a great role? Paste the URL or job description here to instantly generate a tailored resume and score.</p>
            </div>
            <button className="gold-button" onClick={openQuickAdd}><Icon name="plus" />Quick Add</button>
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
            <Icon name="lightbulb" />
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
  const [analyzed, setAnalyzed] = useState(true);
  const score = jd.trim().length > 12 && analyzed ? 72 : 18;

  return (
    <div className="page page-scroll">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Resume Optimizer</p>
          <h2>Relevance Checker</h2>
          <p>Upload your resume and paste a job description to compare fit.</p>
        </div>
        <button className="icon-square"><Icon name="more" /></button>
      </div>
      <section className="input-grid">
        <ResumeUpload />
        <JDInput value={jd} onChange={(value) => { setJd(value); setAnalyzed(false); }} onAnalyze={() => setAnalyzed(true)} />
      </section>
      <MatchDashboard score={score} label={score > 50 ? "Strong Match" : "Needs Input"} />
      <div className="right-actions">
        <button className="gold-button"><Icon name="wand" />Generate Tailored Resume</button>
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
          <button onClick={onClose} aria-label="Close modal"><Icon name="x" /></button>
        </header>
        <div className="modal-body">
          <label>Job URL or Description</label>
          <div className="source-input">
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the job posting URL or the full job description here..." />
            <button aria-label="Extract Details"><Icon name="sparkles" /></button>
          </div>
          <div className="extracted-grid">
            {!extracted && <div className="waiting-pill"><Icon name="loader" className="spin" />Waiting for input...</div>}
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
          <button className="gold-button">Generate Tailored Materials <Icon name="applied" /></button>
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
    activePage === "dashboard" ? <Dashboard openQuickAdd={() => setModalOpen(true)} setActivePage={setActivePage} /> :
    activePage === "tailoring" ? <TailorWorkspace /> :
    activePage === "tracker" ? <TrackerBoard /> :
    <RelevanceChecker />;

  return (
    <Shell activePage={activePage} setActivePage={setActivePage} openQuickAdd={() => setModalOpen(true)}>
      {screen}
      <QuickAddModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Shell>
  );
}

createRoot(document.getElementById("root")).render(<App />);
