# ApplyIQ — Smart Job Application Tracker

ApplyIQ is a full-stack job application tracker built with **React (Vite)** and **FastAPI**. It helps job seekers score resume fit against job descriptions, generate AI-tailored resume bullets and cover letters, and track application progress through an interactive Kanban board.

## Features

- **Google Sign-In** — One-click authentication via Google OAuth 2.0
- **Email/Password Auth** — Traditional signup and login with session-based auth
- **Resume Parsing** — Upload PDF/DOCX resumes for structured data extraction
- **Relevance Scoring** — AI-powered match scoring between your resume and any job description
- **Resume Tailoring** — Generate role-specific bullet points and cover letters using Gemini AI
- **Kanban Tracker** — Drag-and-drop board to manage applications across stages (Wishlist → Applied → Interviewing → Offer)
- **Export** — Download tailored application materials as Markdown

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Frontend    | React, Vite, Vanilla CSS                        |
| Backend     | FastAPI, SQLAlchemy (async), Pydantic            |
| Database    | PostgreSQL (local via Docker or hosted Supabase) |
| AI          | Google Gemini API (`gemini-3.1-flash-lite`)      |
| Auth        | Session cookies, Google OAuth 2.0                |

---

## Prerequisites

- **Node.js** 20+
- **Python** 3.10+
- **Docker Desktop** (for local PostgreSQL) _or_ a **Supabase** account (for hosted PostgreSQL)
- PowerShell or a compatible shell

---

## Quick Start

### 1. Install Frontend Dependencies

```powershell
npm install
```

### 2. Create a Python Virtual Environment

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
```

### 3. Configure Backend Environment

Copy the example and fill in your values:

```powershell
cp backend\.env.example backend\.env
```

Edit `backend\.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/applyiq
GEMINI_API_KEY=your_gemini_key_here
SESSION_SECRET=replace-with-a-long-random-value
DEMO_PASSWORD=choose-a-local-demo-password
COOKIE_SECURE=false
```

> **Get a Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey).

### 4. Start PostgreSQL

**Option A — Local (Docker):**

```powershell
docker compose up -d postgres
```

This starts Postgres at `localhost:5432` with user `postgres`, password `postgres`, database `applyiq`.

**Option B — Hosted (Supabase):**

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection string** and copy the URI
3. Change the scheme from `postgresql://` to `postgresql+asyncpg://`
4. Set it in `backend\.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 5. Run Database Migrations

```powershell
cd backend
alembic upgrade head
cd ..
```

This creates the `users`, `resumes`, `applications`, `scores`, and `tailored_docs` tables.

### 6. Seed Demo Data (Optional)

```powershell
python -m backend.seed
```

Creates a demo user (`demo@applyiq.local`) with sample application data. The seed is idempotent.

### 7. Start the Backend

```powershell
uvicorn backend.main:app --reload --port 8001
```

Verify at: [http://127.0.0.1:8001/health](http://127.0.0.1:8001/health)

API docs at: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

### 8. Start the Frontend

In a separate terminal:

```powershell
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## Google Sign-In Setup (Optional)

To enable "Sign in with Google":

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:5173` and `http://127.0.0.1:5173` to **Authorized JavaScript origins**
4. Create a `.env` file in the **project root** (not `backend\.env`):

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

5. Restart the Vite dev server

> If you skip this step, the Google Sign-In button will not appear, but email/password authentication will still work.

---

## API Endpoints

| Method | Endpoint                         | Description                          |
| ------ | -------------------------------- | ------------------------------------ |
| POST   | `/auth/signup`                   | Create account with email/password   |
| POST   | `/auth/signin`                   | Sign in with email/password          |
| POST   | `/auth/google`                   | Sign in with Google OAuth credential |
| POST   | `/auth/logout`                   | Sign out                             |
| GET    | `/auth/me`                       | Get current user profile             |
| PATCH  | `/auth/me`                       | Update profile                       |
| POST   | `/resumes`                       | Upload and parse a resume            |
| GET    | `/resumes/latest`                | Get the latest parsed resume         |
| GET    | `/applications`                  | List all applications                |
| POST   | `/applications`                  | Create application from JD text/URL  |
| PATCH  | `/applications/{id}/status`      | Update application status            |
| POST   | `/applications/{id}/score`       | Score resume against JD              |
| POST   | `/applications/{id}/tailor`      | Generate tailored bullets and cover letter |
| GET    | `/applications/{id}/export`      | Download tailored docs as Markdown   |

---

## Common Commands

```powershell
# Run backend tests
python -m unittest discover backend\tests -v

# Build frontend for production
npm run build

# Stop local Postgres
docker compose down

# Remove local Postgres data
docker compose down -v
```

---

## Project Structure

```text
.
├── backend/
│   ├── alembic/              # Database migrations
│   ├── routers/              # FastAPI route handlers
│   │   ├── auth.py           # Auth endpoints (email, Google OAuth)
│   │   ├── applications.py   # Application CRUD, scoring, tailoring
│   │   └── resumes.py        # Resume upload and parsing
│   ├── tests/                # Backend tests
│   ├── database.py           # Async SQLAlchemy engine and session
│   ├── models.py             # SQLAlchemy ORM models
│   ├── auth.py               # Password hashing and session helpers
│   ├── tailoring.py          # Gemini AI tailoring prompt and schema
│   ├── scorer.py             # Resume-JD relevance scoring
│   ├── jd_extractor.py       # Job description parsing
│   ├── resume_parser.py      # Resume file parsing (PDF/DOCX)
│   ├── email_service.py      # Login notification emails
│   ├── seed.py               # Demo data seeder
│   ├── .env.example          # Environment variable template
│   └── requirements.txt
├── src/
│   ├── components/           # React UI components
│   │   ├── AccountPages.jsx  # Sign-in, sign-up, profile, settings
│   │   ├── TrackerBoard.jsx  # Kanban drag-and-drop board
│   │   ├── TailorWorkspace.jsx # Tailored docs viewer
│   │   ├── MatchDashboard.jsx  # Score visualization
│   │   └── ...
│   ├── api.js                # API client (fetch wrapper)
│   ├── App.jsx               # Main app state and routing
│   ├── main.jsx              # Vite entry point
│   └── styles.css            # Global styles
├── docker-compose.yml
├── index.html
├── package.json
└── vite.config.js
```

---

## Production Deployment

| Component  | Recommended Service                | Notes                                                  |
| ---------- | ---------------------------------- | ------------------------------------------------------ |
| Frontend   | [Vercel](https://vercel.com)       | Connect your GitHub repo, set framework to Vite        |
| Backend    | [Render](https://render.com)       | Add env variables in the Render dashboard              |
| Database   | [Supabase](https://supabase.com)   | Free tier PostgreSQL with connection pooling            |

When deploying to production:
- Set `COOKIE_SECURE=true` in `backend\.env`
- Update CORS origins in `backend/main.py` to include your production domain
- Add your production domain to Google OAuth **Authorized JavaScript origins**
- Use a strong, random `SESSION_SECRET`

---

## License

This project was built for the OpenAI Hackathon 2026.
