from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.applications import router as applications_router
from backend.routers.resumes import router as resumes_router

app = FastAPI(title="ApplyIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(applications_router)
app.include_router(resumes_router)
