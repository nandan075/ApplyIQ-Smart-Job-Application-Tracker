from __future__ import annotations

import json
import os
import time
from google import genai
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

def tailor_with_gemini(resume_data: dict, jd_text: str) -> TailoredAssets:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    prompt = (
        f"{TAILOR_SYSTEM_PROMPT}\n\n"
        "Base resume JSON:\n"
        f"{json.dumps(resume_data, ensure_ascii=False)}\n\n"
        "Target job description:\n"
        f"{jd_text[:50000]}"
    )
    
    max_retries = 3
    delay = 2
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": TailoredAssets,
                    "temperature": 0.2
                },
            )
            # parse the json string to pydantic model
            return TailoredAssets.model_validate_json(response.text)
        except Exception as exc:
            err_msg = str(exc)
            if ("429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower()) and attempt < max_retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise exc

