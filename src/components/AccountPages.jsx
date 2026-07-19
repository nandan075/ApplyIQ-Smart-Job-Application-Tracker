import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import ResumeUpload from "./ResumeUpload.jsx";


const landingFeatures = [
  {
    icon: "dashboard",
    title: "Smart Relevance Score",
    text: "Analyze how well your resume matches any job description and get clear next steps before you apply.",
    detail: "88% resume fit",
  },
  {
    icon: "wand",
    title: "AI Resume Tailoring",
    text: "Generate role-specific bullets, missing keywords, and cleaner positioning for every application.",
    detail: "ATS-ready updates",
  },
  {
    icon: "clipboard",
    title: "Application Tracking",
    text: "Keep every job, deadline, interview, and follow-up organized in one focused workspace.",
    detail: "Kanban workflow",
  },
];

export function LandingPage({ onSignIn, onGetStarted }) {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#top" aria-label="ApplyIQ home">
          <span className="brand-mark">AIQ</span>
          <span>ApplyIQ</span>
        </a>
        <nav className="landing-nav" aria-label="Landing navigation">
          <a href="#features">Features</a>
          <button type="button" onClick={onSignIn}>Login</button>
          <button type="button" className="landing-nav-cta" onClick={onGetStarted}>Get Started</button>
        </nav>
      </header>

      <section id="top" className="landing-hero">
        <div className="landing-hero-copy">
          <h1>Landing your dream job shouldn't be a full-time job.</h1>
          <p>AI-powered resume tailoring, relevance scoring, and application tracking to help you get hired faster.</p>
          <div className="landing-actions">
            <button type="button" className="gold-button" onClick={onGetStarted}>Get Started for Free</button>
            <a className="outline-button landing-demo-link" href="#features">View Features</a>
          </div>
          <div className="landing-proof">
            <Icon name="sparkles" />
            <span>Resume scoring, tailoring, and tracking in one place</span>
          </div>
        </div>

        <div className="landing-visual" aria-label="ApplyIQ product preview">
          <img
            alt="ApplyIQ dashboard preview with resume score and application tracker"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfiQb5sERazkXeLgBCu-UAUtwyZJiAXh3EgnSXL8b6qwYTLDAkyZJQIXn6EORhb2jz4Wh38glV89HuaG5QxMRVaeQ1cjqcqEw4OChqqCQdFFVzIHWGNWUDAvTjHj9wlyKv921JYNR71-utW6ff9kTCjEw3F8fMadocUp5UAtbhTXhTAZiHjp40D3e4kBZFS9kj73FL2jEmpKV3cABacMIlo8_2rTd1ut3geCq7a6tWkHU_SK0XdBVSlA"
          />
          <div className="landing-float">
            <Icon name="checkCircle" />
            <div>
              <strong>Resume tailored</strong>
              <span>Match score increased to 94%</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features">
        <div className="landing-section-heading">
          <h2>The smarter way to manage your search</h2>
          <p>Everything you need to go from apply to interview with less manual work.</p>
        </div>
        <div className="landing-feature-grid">
          {landingFeatures.map((feature) => (
            <article className="landing-feature-card" key={feature.title}>
              <div className="round-icon"><Icon name={feature.icon} /></div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <span>{feature.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ready to accelerate your career?</h2>
        <p>Start tailoring better applications and tracking every opportunity from one workspace.</p>
        <button type="button" className="gold-button" onClick={onGetStarted}>Sign Up Now</button>
      </section>
    </main>
  );
}

export function SignInPage({ onSignIn, onSignUp, onGoogleSignIn, error, initialMode = "signin", onBackToLanding }) {
  const [mode, setMode] = useState(initialMode);
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


  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (window.google) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1028711333798-h0m45skoboc4f1aeb1npsoc8b63e9f4j.apps.googleusercontent.com";
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            setPending(true);
            onGoogleSignIn(response.credential).finally(() => setPending(false));
          }
        }
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", type: "standard", shape: "rectangular", text: "continue_with", logo_alignment: "left" }
      );
    }
  }, [mode]);

  return (
    <main className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        {onBackToLanding && (
          <button type="button" className="auth-back-button" onClick={onBackToLanding}>
            <Icon name="chevron" /> Back to landing
          </button>
        )}
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
        <div className="auth-divider">or</div>
        <div id="google-signin-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }}></div>
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

export function ProfilePage({ user, openSettings, latestResume, onUploadResume, uploading }) {
  return (
    <div className="page account-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Profile</h2>
        </div>
        <button className="gold-button" onClick={openSettings}>
          <Icon name="edit" />Edit profile
        </button>
      </div>
      
      <section className="panel profile-summary">
        <div className="profile-initial">{(user.name || user.email).slice(0, 1).toUpperCase()}</div>
        <div>
          <h3>{user.name || "ApplyIQ user"}</h3>
          <p>{user.job_title || "Career candidate"}</p>
          <p>{user.email}</p>
          {user.bio && <p>{user.bio}</p>}
        </div>
      </section>

      <section className="profile-resume-section" style={{ marginTop: "24px" }}>
        <div style={{ marginBottom: "12px" }}>
          <h3>Default Resume for Application Tracking</h3>
          <p style={{ color: "var(--secondary)", fontSize: "0.9rem" }}>
            Upload your default resume here. It will be used to automatically calculate match scores and generate tailored suggestions when you add jobs.
          </p>
        </div>
        <ResumeUpload onFileSelected={onUploadResume} uploading={uploading} />
        {latestResume && (
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.9rem" }}>
            <Icon name="checkCircle" size={16} />
            <span>
              Default resume is set (uploaded on {new Date(latestResume.created_at).toLocaleDateString()})
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

export function SettingsPage({ user, onSave, onUpdatePassword, onDeleteAccount }) {
  // Profile Info state
  const [profileForm, setProfileForm] = useState(user);
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Visibility state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setProfileForm(user);
  }, [user]);

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfilePending(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      await onSave(profileForm);
      setProfileSuccess("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordPending(true);
    try {
      await onUpdatePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="page settings-page">
      <div className="settings-header">
        <div className="breadcrumb">Account / Settings</div>
        <h2>Settings</h2>
        <p className="subtitle">Manage your account information and security.</p>
      </div>

      <div className="settings-grid">
        {/* Left Column: Profile Information */}
        <div className="settings-col">
          <form className="panel settings-card" onSubmit={handleProfileSubmit}>
            <div className="card-header">
              <div className="header-icon-circle purple"><Icon name="user" /></div>
              <div>
                <h3>Profile Information</h3>
                <p>Update your personal details.</p>
              </div>
            </div>

            {profileError && (
              <div className="status-banner error-banner" style={{ borderRadius: "8px" }}>
                <Icon name="alert" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="status-banner success-banner" style={{ borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="checkCircle" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <div className="form-group">
              <label>Full name</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  value={profileForm.name || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
                <Icon name="user" className="input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  value={profileForm.email || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
                <Icon name="mail" className="input-icon" />
              </div>
              <div className="verified-badge">
                <Icon name="checkCircle" size={14} /> Email verified
              </div>
            </div>

            <div className="form-group">
              <label>Job title (Optional)</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Data Scientist"
                  value={profileForm.job_title || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                />
                <Icon name="briefcase" className="input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>About</label>
              <textarea
                value={profileForm.bio || ""}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>

            <button type="submit" className="gold-button width-full" disabled={profilePending}>
              {profilePending ? <Icon name="loader" className="spin" /> : <Icon name="lock" />}
              Save changes
            </button>
          </form>
        </div>

        {/* Right Column: Update Password & Delete Account */}
        <div className="settings-col">
          {/* Card 1: Update Password */}
          <form className="panel settings-card" onSubmit={handlePasswordSubmit}>
            <div className="card-header">
              <div className="header-icon-circle blue"><Icon name="lock" /></div>
              <div>
                <h3>Update Password</h3>
                <p>Choose a strong password to keep your account secure.</p>
              </div>
            </div>

            {passwordError && (
              <div className="status-banner error-banner" style={{ borderRadius: "8px" }}>
                <Icon name="alert" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="status-banner success-banner" style={{ borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="checkCircle" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="form-group">
              <label>Current password</label>
              <div className="input-with-icon">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button type="button" className="visibility-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                  <Icon name={showCurrent ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New password</label>
              <div className="input-with-icon">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="visibility-toggle" onClick={() => setShowNew(!showNew)}>
                  <Icon name={showNew ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <div className="input-with-icon">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" className="visibility-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  <Icon name={showConfirm ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            <button type="submit" className="lavender-button width-full" disabled={passwordPending}>
              {passwordPending ? <Icon name="loader" className="spin" /> : <Icon name="lock" />}
              Update password
            </button>
          </form>

          {/* Card 2: Delete Account */}
          <div className="panel settings-card" style={{ marginTop: "24px" }}>
            <div className="card-header">
              <div className="header-icon-circle red"><Icon name="trash" /></div>
              <div>
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all data.</p>
              </div>
            </div>

            <div className="warning-callout">
              <Icon name="alert" />
              <span>
                This action cannot be undone. All your data including applications, resumes and settings will be permanently deleted.
              </span>
            </div>

            <button type="button" className="danger-button width-full" onClick={onDeleteAccount}>
              <Icon name="trash" /> Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const faqs = [
  {
    q: "What is ApplyIQ?",
    a: <p>ApplyIQ is an AI-powered job application tracker that helps you organize job applications, analyze resume relevance, tailor resumes, and track your application progress.</p>
  },
  {
    q: "How do I create a new application?",
    a: <p>Click the "New Application" button in the sidebar, fill in the required information, upload your resume if needed, and save it.</p>
  },
  {
    q: "What is the Relevance Score?",
    a: (
      <div>
        <p>The Relevance Score measures how closely your resume matches a job description using AI semantic analysis.</p>
        <ul style={{ margin: "8px 0 0", paddingLeft: "16px", listStyleType: "none" }}>
          <li style={{ marginBottom: "4px" }}>â€¢ <strong>90â€“100%</strong> = Excellent Match</li>
          <li style={{ marginBottom: "4px" }}>â€¢ <strong>75â€“89%</strong> = Good Match</li>
          <li style={{ marginBottom: "4px" }}>â€¢ <strong>Below 75%</strong> = Resume needs improvement.</li>
        </ul>
      </div>
    )
  },
  {
    q: "How does Resume Tailoring work?",
    a: <p>ApplyIQ analyzes your resume and the selected job description to suggest ATS-friendly improvements, missing skills, and relevant keywords.</p>
  },
  {
    q: "Can I track my application status?",
    a: <p>Yes. You can track applications through stages such as Applied, Interview, Assessment, Offer, Rejected, and Withdrawn.</p>
  },
  {
    q: "Can I upload multiple resumes?",
    a: <p>Yes. You can upload multiple resumes and choose the appropriate one for each application.</p>
  },
  {
    q: "What file formats are supported?",
    a: <p>Currently, PDF (.pdf) and DOCX (.docx) files are supported.</p>
  },
  {
    q: "Is my data secure?",
    a: <p>Yes. Your resumes, applications, and profile information are securely stored and only accessible through your account.</p>
  },
  {
    q: "How do I change my password?",
    a: <p>Go to Settings â†’ Update Password and follow the instructions.</p>
  },
  {
    q: "How do I delete my account?",
    a: <p>Go to Settings â†’ Delete Account. This action permanently removes your account and all associated data.</p>
  },
  {
    q: "I found a bug. How can I report it?",
    a: <p>Please contact our support team using the email below.</p>
  }
];

export function HelpPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="page help-page">
      <div className="help-header">
        <div className="breadcrumb">Account / Support</div>
        <h2>Help Center</h2>
        <p className="subtitle">Find answers to common questions about ApplyIQ.</p>
      </div>

      <div className="help-card">
        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            return (
              <div key={index} className={`faq-item ${isActive ? "active" : ""}`}>
                <button
                  type="button"
                  className="faq-header"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isActive}
                >
                  <span className="faq-question">{faq.q}</span>
                  <Icon name="chevron" size={18} className="faq-chevron" />
                </button>
                <div className="faq-content-wrapper">
                  <div className="faq-content">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <hr className="faq-divider" />

        <div className="faq-footer">
          <h4>Need more help?</h4>
          <p>If you couldn't find the answer you're looking for, contact us.</p>
          <a href="mailto:support@applyiq.com" className="email-link">
            <Icon name="mail" size={16} /> support@applyiq.com
          </a>
        </div>
      </div>
    </div>
  );
}
