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
Return exactly two assets: tailored_bullets and cover_letter. The cover letter must be professional, concise, and focused only on the intersection of the base resume and target role goals.
"""


class TailoredAssets(BaseModel):
    tailored_bullets: list[str] = Field(
        min_length=1,
        description="Modified resume bullets grounded only in the base resume and aligned to JD keywords.",
    )
    cover_letter: str = Field(
        min_length=1,
        description="Concise professional cover letter grounded only in the base resume and target role goals.",
    )


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
