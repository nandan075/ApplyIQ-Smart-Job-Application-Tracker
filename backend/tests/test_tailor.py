from datetime import datetime, timezone
from uuid import uuid4
import unittest

from fastapi import HTTPException

from backend.models import Application, Resume, TailoredDoc
from backend.routers import applications
from backend.tailoring import TAILOR_SYSTEM_PROMPT, TailoredAssets, build_tailor_input


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value

    def scalars(self):
        return self

    def first(self):
        return self.value


class FakeDb:
    def __init__(self, *results):
        self.results = list(results)
        self.added = []
        self.committed = False

    async def execute(self, _statement):
        return FakeResult(self.results.pop(0))

    def add(self, value):
        self.added.append(value)

    async def commit(self):
        self.committed = True

    async def refresh(self, value):
        value.id = value.id or uuid4()
        value.created_at = value.created_at or datetime.now(timezone.utc)


class TailoringTests(unittest.TestCase):
    def test_prompt_forbids_fabrication(self):
        prompt = TAILOR_SYSTEM_PROMPT.lower()
        for phrase in [
            "only reorder",
            "strictly forbidden",
            "tool",
            "metric",
            "date",
            "company",
            "accomplishment",
            "tailored_bullets",
            "cover_letter",
        ]:
            self.assertIn(phrase, prompt)

    def test_tailor_input_contains_resume_and_jd(self):
        messages = build_tailor_input({"skills": [{"skills": ["Python"]}]}, "Need Python and Postgres")
        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("Python", messages[1]["content"])
        self.assertIn("Need Python and Postgres", messages[1]["content"])

    def test_tailored_assets_schema(self):
        assets = TailoredAssets(tailored_bullets=["Built APIs with Python."], cover_letter="Dear Hiring Team,")
        self.assertEqual(assets.tailored_bullets[0], "Built APIs with Python.")


class TailorEndpointTests(unittest.IsolatedAsyncioTestCase):
    async def test_tailor_application_saves_and_returns_assets(self):
        user_id = uuid4()
        app_id = uuid4()
        resume_data = {"experience": [{"company": "Acme", "bullets": ["Built Python APIs."]}]}
        application = Application(
            id=app_id,
            user_id=user_id,
            company="Globex",
            role="Backend Engineer",
            jd_text="Need Python API experience.",
            status="Applied",
            created_at=datetime.now(timezone.utc),
        )
        resume = Resume(id=uuid4(), user_id=user_id, structured_data=resume_data, created_at=datetime.now(timezone.utc))
        db = FakeDb(application, resume, None)
        calls = []

        def fake_tailor(data, jd_text):
            calls.append((data, jd_text))
            return TailoredAssets(
                tailored_bullets=["Built Python APIs for Acme."],
                cover_letter="Dear Hiring Team, I built Python APIs relevant to this role.",
            )

        original = applications.tailor_with_openai
        applications.tailor_with_openai = fake_tailor
        try:
            response = await applications.tailor_application(app_id, db)
        finally:
            applications.tailor_with_openai = original

        self.assertEqual(calls, [(resume_data, "Need Python API experience.")])
        self.assertEqual(response.application_id, app_id)
        self.assertEqual(response.tailored_bullets, ["Built Python APIs for Acme."])
        self.assertIn("Dear Hiring Team", response.cover_letter)
        self.assertTrue(db.committed)
        self.assertIsInstance(db.added[0], TailoredDoc)
        self.assertEqual(db.added[0].application_id, app_id)

    async def test_tailor_application_404s_without_application(self):
        with self.assertRaises(HTTPException) as error:
            await applications.tailor_application(uuid4(), FakeDb(None))

        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(error.exception.detail, "Application not found.")


if __name__ == "__main__":
    unittest.main()
