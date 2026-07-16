import { useEffect, useMemo, useState } from "react";
import {
  createApplication,
  getApplications,
  scoreApplication,
  tailorApplication,
  updateApplicationStatus,
  uploadResume,
  getCurrentUser,
  signIn,
  signUp,
  signOut,
  updateCurrentUser,
  downloadExport,
  getLatestResume,
} from "./api.js";
import Icon from "./components/Icon.jsx";
import JDInput from "./components/JDInput.jsx";
import MatchDashboard from "./components/MatchDashboard.jsx";
import ResumeUpload from "./components/ResumeUpload.jsx";
import TailorWorkspace from "./components/TailorWorkspace.jsx";
import TrackerBoard from "./components/TrackerBoard.jsx";
import { HelpPage, ProfilePage, SettingsPage, SignInPage } from "./components/AccountPages.jsx";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "relevance", label: "Relevance", icon: "checkCircle" },
  { id: "tailoring", label: "Tailoring", icon: "wand" },
  { id: "tracker", label: "Tracker", icon: "clipboard" },
  { id: "profile", label: "Profile", icon: "edit" },
];

function Shell({ activePage, setActivePage, openQuickAdd, error, clearError, statusText, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-block">
          <div className="brand-mark">AIQ</div>
          <div><h1>ApplyIQ</h1><p>Career Assistant</p></div>
        </div>
        <button className="primary-side-button" onClick={openQuickAdd}><Icon name="plus" />New Application</button>
        <nav className="nav-links">
          {pages.map((page) => (
            <button key={page.id} className={activePage === page.id ? "active" : ""} onClick={() => setActivePage(page.id)}>
              <Icon name={page.icon} />{page.label}
            </button>
          ))}
        </nav>
        <div className="nav-footer">
          <button onClick={() => setActivePage("settings")}><Icon name="settings" />Settings</button>
          <button onClick={() => setActivePage("help")}><Icon name="help" />Help</button>
          <button onClick={onLogout}><Icon name="x" />Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="mobile-header"><strong>ApplyIQ</strong><button onClick={openQuickAdd}><Icon name="plus" /></button></header>
        {error && <div className="status-banner error-banner"><Icon name="alert" /><span>{error}</span><button onClick={clearError}><Icon name="x" /></button></div>}
        {statusText && <div className="status-banner pending-banner"><Icon name="loader" className="spin" /><span>{statusText}</span></div>}
        {children}
      </main>
    </div>
  );
}

function Dashboard({ user, applications, scores, loading, openQuickAdd, setActivePage, setSelectedAppId }) {
  const counts = useMemo(() => {
    const base = { Wishlist: 0, Applied: 0, Interviewing: 0, Offer: 0 };
    applications.forEach((app) => { if (base[app.status] !== undefined) base[app.status] += 1; });
    return base;
  }, [applications]);
  const stats = [
    { label: "Saved", value: counts.Wishlist, icon: "bookmark" },
    { label: "Applied", value: counts.Applied, icon: "applied" },
    { label: "Interviewing", value: counts.Interviewing, icon: "mail", featured: true },
    { label: "Offers", value: counts.Offer, icon: "star" },
  ];
  const recent = applications.slice(0, 3);

  return (
    <div className="page dashboard-page">
      <div className="page-title-row"><div><h2>Welcome back, {user?.name || "there"}.</h2><p>Let's keep the momentum going on your applications.</p></div></div>
      <section className="stats-grid">
        {stats.map((stat) => <article className={`stat-card ${stat.featured ? "featured" : ""}`} key={stat.label}><div className="stat-orb" /><Icon name={stat.icon} /><strong>{stat.value}</strong><span>{stat.label}</span></article>)}
      </section>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="quick-card"><div><h3><Icon name="sparkles" />Fast-Track Application</h3><p>Found a great role? Paste the URL or job description here to instantly generate a tailored resume and score.</p></div><button className="gold-button" onClick={openQuickAdd}><Icon name="plus" />Quick Add</button></section>
          <section>
            <div className="section-title-row"><h3>Recent Analysis</h3><button onClick={() => setActivePage("relevance")}>View All</button></div>
            <div className="analysis-feed">
              {loading && <div className="panel skeleton-stack"><span /><span /><span /></div>}
              {!loading && recent.length === 0 && <div className="panel empty-state">No applications yet. Add one to start scoring.</div>}
              {recent.map((item) => (
                <article
                  className="analysis-card clickable"
                  key={item.id}
                  onClick={() => {
                    setSelectedAppId(item.id);
                    setActivePage("relevance");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div className="company-logo">{item.company.slice(0, 1)}</div>
                  <div>
                    <h4>{item.role}</h4>
                    <p>{item.company}</p>
                    <span>{item.jd_text.slice(0, 96)}...</span>
                  </div>
                  <strong>{scores[item.id]?.relevance_score || 0}%</strong>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-side"><section className="task-card"><h3>Upcoming Tasks</h3><ul><li><b />Follow up with Nova<span>Today</span></li><li><b />Prep BrightDesk notes<span>Tomorrow</span></li><li><b />Submit TechNova draft<span>Fri</span></li></ul><button className="outline-button" onClick={() => setActivePage("tracker")}>Open Tracker</button></section><section className="tip-card"><Icon name="lightbulb" /><h3>Optimizer Tip</h3><p>Tailoring your resume to match specific keywords increases interview chances. Run your latest draft through the optimizer.</p><button onClick={() => setActivePage("tailoring")}>Optimize Now</button></section></aside>
      </div>
    </div>
  );
}

function RelevanceChecker({ selectedApplication, jd, setJd, onUploadResume, onAnalyze, onTailor, pending, score }) {
  const scoreValue = score?.relevance_score || 0;
  return (
    <div className="page page-scroll">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Resume Optimizer</p>
          <h2>Relevance Checker</h2>
          {selectedApplication ? (
            <p className="job-details-subtitle" style={{ fontSize: "1.1rem", marginTop: "4px" }}>
              Comparing fit for: <strong style={{ color: "var(--primary, #f59e0b)" }}>{selectedApplication.role}</strong> at <strong style={{ color: "var(--primary, #f59e0b)" }}>{selectedApplication.company}</strong>
            </p>
          ) : (
            <p>Upload your resume and paste a job description to compare fit.</p>
          )}
        </div>
        <button className="icon-square"><Icon name="more" /></button>
      </div>
      <section className="input-grid">
        <ResumeUpload onFileSelected={onUploadResume} uploading={pending.upload} />
        <JDInput value={jd} onChange={setJd} onAnalyze={onAnalyze} loading={pending.create || pending.score} />
      </section>
      <MatchDashboard
        loading={pending.score}
        score={scoreValue}
        label={scoreValue > 50 ? "Strong Match" : "Needs Input"}
        strengths={score?.matched_strengths}
        gaps={score?.drawbacks}
        suggestions={score?.fix_suggestions}
      />
      <div className="right-actions"><button className="gold-button" onClick={onTailor} disabled={pending.tailor}><Icon name={pending.tailor ? "loader" : "wand"} className={pending.tailor ? "spin" : ""} />Generate Tailored Resume</button></div>
    </div>
  );
}

function QuickAddModal({ open, onClose, onSubmit, loading }) {
  const [text, setText] = useState("");
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
        <header><div><h2 id="quick-add-title">Quick Add Job</h2><p>Paste a URL or description to auto-extract details.</p></div><button onClick={onClose} aria-label="Close modal"><Icon name="x" /></button></header>
        <div className="modal-body"><label>Job URL or Description</label><div className="source-input"><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the job posting URL or the full job description here..." /><button aria-label="Extract Details"><Icon name="sparkles" /></button></div></div>
        <footer><button className="outline-button" onClick={onClose}>Cancel</button><button className="gold-button" disabled={!text.trim() || loading} onClick={() => onSubmit(text).then(() => setText("")).catch(() => {})}><Icon name={loading ? "loader" : "applied"} className={loading ? "spin" : ""} />Analyze & Track</button></footer>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [latestResume, setLatestResume] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [jd, setJd] = useState("We need a senior frontend engineer with React, Node.js, AWS, mentoring, GraphQL APIs, and measurable product impact.");
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [scores, setScores] = useState({});
  const [tailoredDocs, setTailoredDocs] = useState({});
  const [pending, setPending] = useState({ initial: true, upload: false, create: false, score: false, tailor: false, statusId: null });
  const [error, setError] = useState("");

  const selectedApplication = applications.find((app) => app.id === selectedAppId) || applications[0];
  const selectedScore = selectedApplication ? scores[selectedApplication.id] : null;
  const selectedTailoredDoc = selectedApplication ? tailoredDocs[selectedApplication.id] : null;
  const statusText = pending.upload ? "Parsing resume into structured data..." : pending.create ? "Creating application from job description..." : pending.score ? "Calculating match score with GPT..." : pending.tailor ? "Generating tailored bullets and cover letter..." : pending.statusId ? "Updating application status..." : "";

  async function refreshApplications() {
    const data = await getApplications();
    setApplications(data);
    return data;
  }

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u);
        return getLatestResume();
      })
      .then(setLatestResume)
      .catch((err) => { if (err.status !== 401) setError(err.message); })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshApplications().catch((err) => setError(err.message)).finally(() => setPending((p) => ({ ...p, initial: false })));
    getLatestResume().then(setLatestResume).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (selectedApplication) {
      setJd(selectedApplication.jd_text);
    }
  }, [selectedApplication]);

  async function run(key, action) {
    setError("");
    setPending((p) => ({ ...p, [key]: true }));
    try {
      return await action();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleSignIn(email, password) {
    setError("");
    try { setUser(await signIn(email, password)); } catch (err) { setError(err.message); throw err; }
  }

  async function handleSignUp(name, email, password) {
    setError("");
    try { setUser(await signUp(name, email, password)); } catch (err) { setError(err.message); throw err; }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setApplications([]);
    setActivePage("dashboard");
  }

  async function handleProfileSave(profile) {
    try { setUser(await updateCurrentUser(profile)); setActivePage("profile"); } catch (err) { setError(err.message); throw err; }
  }
  async function handleUploadResume(file) {
    const resume = await run("upload", () => uploadResume(file));
    setLatestResume(resume);
    return resume;
  }

  async function analyzeText(text = jd) {
    const application = await run("create", () => createApplication(text));
    setApplications((items) => [application, ...items.filter((item) => item.id !== application.id)]);
    setSelectedAppId(application.id);
    setModalOpen(false);
    setActivePage("relevance");
    try {
      const score = await run("score", () => scoreApplication(application.id));
      setScores((items) => ({ ...items, [application.id]: score }));
    } catch (err) {
      if (err.status === 404) {
        setError("Application tracked! Upload a default resume in your Profile to automatically check fit scores.");
      } else {
        setError(err.message);
      }
    }
    await refreshApplications();
    return application;
  }

  async function handleTailor() {
    if (!selectedApplication) return setError("Create or select an application before tailoring documents.");
    try {
      const doc = await run("tailor", () => tailorApplication(selectedApplication.id));
      setTailoredDocs((items) => ({ ...items, [selectedApplication.id]: doc }));
      setActivePage("tailoring");
    } catch (err) {
      if (err.status === 404) {
        setError("Please upload a resume in your Profile before tailoring documents.");
      } else {
        setError(err.message);
      }
    }
    await refreshApplications();
  }

  async function handleExport() {
    if (!selectedApplication) return;
    try {
      const filename = `applyiq-${selectedApplication.company}-${selectedApplication.role}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + ".md";
      await downloadExport(selectedApplication.id, filename);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(appId, status) {
    setError("");
    setPending((p) => ({ ...p, statusId: appId }));
    const before = applications;
    setApplications((items) => items.map((item) => item.id === appId ? { ...item, status } : item));
    try {
      await updateApplicationStatus(appId, status);
      await refreshApplications();
    } catch (err) {
      setApplications(before);
      setError(err.message);
    } finally {
      setPending((p) => ({ ...p, statusId: null }));
    }
  }

  const screen =
    activePage === "dashboard" ? <Dashboard user={user} applications={applications} scores={scores} loading={pending.initial} openQuickAdd={() => setModalOpen(true)} setActivePage={setActivePage} setSelectedAppId={setSelectedAppId} /> :
    activePage === "tailoring" ? <TailorWorkspace application={selectedApplication} tailoredDoc={selectedTailoredDoc} loading={pending.tailor} onTailor={handleTailor} onExport={handleExport} score={selectedScore?.relevance_score || 87} /> :
    activePage === "tracker" ? <TrackerBoard applications={applications} scores={scores} loading={pending.initial} pendingStatusId={pending.statusId} onStatusChange={handleStatusChange} setSelectedAppId={setSelectedAppId} setActivePage={setActivePage} /> :
    activePage === "profile" ? <ProfilePage user={user} openSettings={() => setActivePage("settings")} latestResume={latestResume} onUploadResume={handleUploadResume} uploading={pending.upload} /> :
    activePage === "settings" ? <SettingsPage user={user} onSave={handleProfileSave} /> :
    activePage === "help" ? <HelpPage /> :
    <RelevanceChecker selectedApplication={selectedApplication} jd={jd} setJd={setJd} onUploadResume={handleUploadResume} onAnalyze={() => analyzeText(jd).catch(() => {})} onTailor={handleTailor} pending={pending} score={selectedScore} />;

  if (!authReady) return null;
  if (!user) return <SignInPage onSignIn={handleSignIn} onSignUp={handleSignUp} error={error} />;

  return (
    <Shell activePage={activePage} setActivePage={setActivePage} openQuickAdd={() => setModalOpen(true)} error={error} clearError={() => setError("")} statusText={statusText} onLogout={handleSignOut}>
      {screen}
      <QuickAddModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={analyzeText} loading={pending.create || pending.score} />
    </Shell>
  );
}

