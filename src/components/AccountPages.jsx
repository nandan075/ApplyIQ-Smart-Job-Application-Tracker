import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

export function SignInPage({ onSignIn, onSignUp, error }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    try {
      if (mode === "signup") {
        await onSignUp(name, email, password);
      } else {
        await onSignIn(email, password);
      }
    } finally {
      setPending(false);
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
  }

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <div className="brand-block">
          <div className="brand-mark">AIQ</div>
          <div>
            <h1>ApplyIQ</h1>
            <p>Career Assistant</p>
          </div>
        </div>
        <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>
        <p>{mode === "signin" ? "Continue to your application workspace." : "Get started with ApplyIQ for free."}</p>
        {error && <p className="auth-error">{error}</p>}
        {mode === "signup" && (
          <label>
            Full Name
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="Alex Morgan" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <div className="password-input-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength="8"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="Min 8 characters"
              style={{ paddingRight: "44px", width: "100%" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={20} />
            </button>
          </div>
        </label>
        <button className="gold-button" disabled={pending}>
          {pending ? <Icon name="loader" className="spin" /> : <Icon name="applied" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <p className="auth-toggle">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="auth-toggle-link" onClick={toggleMode}>
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </form>
    </main>
  );
}

export function ProfilePage({ user, openSettings }) {
  return <div className="page account-page"><div className="page-title-row"><div><p className="eyebrow">Account</p><h2>Profile</h2></div><button className="gold-button" onClick={openSettings}><Icon name="edit" />Edit profile</button></div><section className="panel profile-summary"><div className="profile-initial">{(user.name || user.email).slice(0, 1).toUpperCase()}</div><div><h3>{user.name || "ApplyIQ user"}</h3><p>{user.job_title || "Career candidate"}</p><p>{user.email}</p>{user.bio && <p>{user.bio}</p>}</div></section></div>;
}

export function SettingsPage({ user, onSave }) {
  const [form, setForm] = useState(user);
  const [pending, setPending] = useState(false);
  useEffect(() => setForm(user), [user]);
  async function submit(event) { event.preventDefault(); setPending(true); try { await onSave(form); } finally { setPending(false); } }
  return <div className="page account-page"><div className="page-title-row"><div><p className="eyebrow">Account</p><h2>Settings</h2></div></div><form className="panel settings-form" onSubmit={submit}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Job title<input value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} /></label><label>About<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label><button className="gold-button" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button></form></div>;
}

export function HelpPage() {
  return <div className="page account-page"><div className="page-title-row"><div><p className="eyebrow">Support</p><h2>Help</h2></div></div><section className="panel help-list"><h3>Getting started</h3><p>Add a job, upload a resume, then use Relevance Checker to assess the fit.</p><h3>Need help?</h3><p>Contact your ApplyIQ workspace administrator for account and application support.</p></section></div>;
}
