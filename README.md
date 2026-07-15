# ApplyIQ

ApplyIQ is a job application tracker with a Vite/React frontend and a FastAPI + PostgreSQL backend. The backend can parse resumes, store job applications, and generate tailored resume bullets plus a cover letter using OpenAI structured outputs.

## What Is Built

- Frontend scaffold with Vite and React.
- Static Stitch mockups in `stitch_exports/`.
- FastAPI backend in `backend/`.
- PostgreSQL local database via `docker-compose.yml`.
- Async SQLAlchemy models and Alembic migrations.
- Resume upload endpoint:
  - `POST /resumes`
  - Accepts `.pdf` or `.docx`.
  - Extracts text with `pdfplumber` or `python-docx`.
  - Parses structured resume JSON with OpenAI.
  - Stores data in `resumes`.
- Application endpoint:
  - `POST /applications`
  - Accepts pasted job description text.
  - Extracts company, role, and deadline when missing.
  - Stores data in `applications`.
- Tailoring endpoint:
  - `POST /applications/{application_id}/tailor`
  - Uses the latest stored resume and application job description.
  - Generates `tailored_bullets` and `cover_letter`.
  - Stores data in `tailored_docs`.
- Small test suite for tailoring prompt safety.

## Requirements

- Node.js
- Python 3.11+
- Docker Desktop
- OpenAI API key

## Project Structure

```text
.
+-- src/                    # Vite React frontend
+-- stitch_exports/         # Exported static UI mockups
+-- backend/
|   +-- alembic/            # Database migrations
|   +-- routers/            # FastAPI route modules
|   +-- tests/              # Backend tests
|   +-- database.py         # Async DB setup
|   +-- main.py             # FastAPI app
|   +-- models.py           # SQLAlchemy models
|   +-- tailoring.py        # Tailoring prompt + OpenAI call
|   +-- requirements.txt
|   +-- .env.example
+-- docker-compose.yml      # Local Postgres
+-- package.json
+-- vite.config.js
```

## Backend Setup

From the project root:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
copy backend\.env.example backend\.env
```

Edit `backend\.env` and set:

```env
OPENAI_API_KEY=your_real_key_here
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/applyiq
```

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Apply migrations:

```powershell
alembic -c backend\alembic.ini upgrade head
```

Run the backend:

```powershell
uvicorn backend.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/health
```

## Frontend Setup

In a second terminal:

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

To build the frontend:

```powershell
npm run build
```

To preview the production build:

```powershell
npm run preview
```

## API Examples

Upload a resume:

```powershell
curl.exe -X POST http://127.0.0.1:8000/resumes -F "file=@C:\path\to\resume.pdf"
```

Create an application:

```powershell
curl.exe -X POST http://127.0.0.1:8000/applications `
  -H "Content-Type: application/json" `
  -d "{\"jd_text\":\"Acme is hiring a Backend Engineer. Apply by 2026-08-15.\"}"
```

Tailor documents for an application:

```powershell
curl.exe -X POST http://127.0.0.1:8000/applications/YOUR_APPLICATION_UUID/tailor
```

## Tests

Run backend tests:

```powershell
python -m unittest discover backend\tests -v
```

## Notes

- The backend currently uses a default test user: `test@example.com`.
- Resume tailoring is prompt-guarded to only rephrase or emphasize facts already present in the parsed resume.
- Real authentication and file storage are not implemented yet.
