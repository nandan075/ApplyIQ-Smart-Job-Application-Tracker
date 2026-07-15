from __future__ import annotations

import json
import os

from openai import OpenAI
from pydantic import BaseModel, Field

TAILOR_SYSTEM_PROMPT = """ABSOLUTE, UNBREAKABLE RESUME TRUTH CONSTRAINT:
You must ONLY reorder, rephrase, condense, expand, or emphasize experience, skills, projects, education, certifications, and achievements that are explicitly present in the provided base resume JSON.
It is STRICTLY FORBIDDEN to invent or imply any tool, metric, date, company, title, project, certification, client, technology, domain, award, responsibility, or accomplishment that is not present in the base resume.
If the job description asks for something absent from the resume, omit it or frame adjacent real experience without claiming the missing item.
Every tailored bullet and every cover letter claim must be traceable to the base resume JSON.
"""


class TailoredAssets(BaseModel):
    tailored_bullets: list[str] = Field(min_length=1)
    cover_letter: str = Field(min_length=1)


def build_tailor_input(resume_data: dict, jd_text: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": TAILOR_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                "Base resume JSON:\n"
                f"{json.dumps(resume_data, ensure_ascii=False)}\n\n"
                "Target job description:\n"
                f"{jd_text[:50000]}"
            ),
        },
    ]


def tailor_with_openai(resume_data: dict, jd_text: str) -> TailoredAssets:
    client = OpenAI()
    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        input=build_tailor_input(resume_data, jd_text),
        text_format=TailoredAssets,
    )
    return response.output_parsed
