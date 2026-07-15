import unittest

from backend.tailoring import TAILOR_SYSTEM_PROMPT, TailoredAssets, build_tailor_input


class TailoringTests(unittest.TestCase):
    def test_prompt_forbids_fabrication(self):
        prompt = TAILOR_SYSTEM_PROMPT.lower()
        for phrase in ["only reorder", "strictly forbidden", "tool", "metric", "date", "company", "accomplishment"]:
            self.assertIn(phrase, prompt)

    def test_tailor_input_contains_resume_and_jd(self):
        messages = build_tailor_input({"skills": [{"skills": ["Python"]}]}, "Need Python and Postgres")
        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("Python", messages[1]["content"])
        self.assertIn("Need Python and Postgres", messages[1]["content"])

    def test_tailored_assets_schema(self):
        assets = TailoredAssets(tailored_bullets=["Built APIs with Python."], cover_letter="Dear Hiring Team,")
        self.assertEqual(assets.tailored_bullets[0], "Built APIs with Python.")


if __name__ == "__main__":
    unittest.main()
