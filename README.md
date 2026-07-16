# ApplyIQ

ApplyIQ is a Vite/React and FastAPI application for tracking job applications, scoring resume fit, and generating tailored resume bullets plus cover letters. The project can run with seeded demo data so you can explore the UI before adding an OpenAI key.

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop
- PowerShell or a compatible shell

## 1. Install Frontend Dependencies

```powershell
npm install
```

## 2. Create A Python Environment

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
```

## 3. Configure Backend Environment

Create `backend\.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/applyiq
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY` is only required when you upload/parse a real resume, create applications from unstructured JDs, score applications, or generate new tailored docs. The seed data lets the app open with mock content without using OpenAI.

## 4. Start Postgres

```powershell
docker compose up -d postgres
```

Postgres runs at `localhost:5432` with:

- user: `postgres`
- password: `postgres`
- database: `applyiq`

## 5. Run Database Migrations

```powershell
alembic -c backend\alembic.ini upgrade head
```

This creates the `users`, `resumes`, `applications`, `scores`, and `tailored_docs` tables.

## 6. Seed Demo Data

```powershell
python -m backend.seed
```

The seed inserts:

- `demo@applyiq.local`
- a parsed software engineer resume
- an `Interviewing` application for `Senior Software Engineer` at `OrbitWorks`
- a mock relevance score
- tailored resume bullets and a cover letter

The seed is idempotent and can be run more than once.

## 7. Start FastAPI

```powershell
uvicorn backend.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/health
```

## 8. Start The Vite App

In another terminal:

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

If your API runs somewhere else, create a frontend env file such as `.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Useful API Endpoints

```text
POST   /resumes
GET    /applications
POST   /applications
PATCH  /applications/{id}/status
POST   /applications/{id}/score
POST   /applications/{id}/tailor
GET    /applications/{id}/export
```

Export returns a downloadable Markdown file containing the match score, tailored resume bullets, cover letter, and original job description.

## Common Commands

Run backend tests:

```powershell
python -m unittest discover backend\tests -v
```

Compile backend files:

```powershell
python -m compileall -q backend
```

Build the frontend:

```powershell
npm run build
```

Stop Postgres:

```powershell
docker compose down
```

Remove local Postgres data:

```powershell
docker compose down -v
```

## Project Structure

```text
.
+-- backend/
|   +-- alembic/              # Database migrations
|   +-- routers/              # FastAPI routers
|   +-- tests/                # Backend tests
|   +-- database.py           # Async SQLAlchemy engine/session
|   +-- models.py             # SQLAlchemy models
|   +-- seed.py               # Demo data seed
|   +-- tailoring.py          # OpenAI tailoring prompt and schema
|   +-- requirements.txt
+-- src/
|   +-- components/           # React UI components
|   +-- api.js                # Fetch client
|   +-- App.jsx               # App state and API wiring
|   +-- main.jsx              # Vite entrypoint
|   +-- styles.css
+-- stitch_exports/           # Original Stitch static exports
+-- docker-compose.yml
+-- package.json
+-- vite.config.js
```

## Notes

- Demo data avoids the OpenAI dependency for first run.
- Real resume parsing, JD extraction, scoring, and tailoring call OpenAI.
- Authentication and durable file storage are intentionally not implemented yet.
