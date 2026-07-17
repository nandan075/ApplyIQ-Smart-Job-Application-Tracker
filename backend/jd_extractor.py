from __future__ import annotations

import re
from datetime import date
from dateutil import parser as date_parser
import spacy
from pydantic import BaseModel

class ExtractedJobInfo(BaseModel):
    company: str | None = None
    role: str | None = None
    deadline: date | None = None

# Load the small english model for NER
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if not downloaded yet
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_company(text: str, doc) -> str | None:
    # 1. Try spaCy NER for ORG in the first 1000 characters
    for ent in doc[:250].ents:
        if ent.label_ == "ORG" and len(ent.text) > 2 and len(ent.text) < 50:
            return ent.text.strip()
    
    # 2. Regex fallback for common patterns
    patterns = [
        r"about\s+([A-Z][a-zA-Z0-9\s]+?)\n",
        r"(?:at|join)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\.|,)",
        r"([A-Z][a-zA-Z0-9\s]+?)\s+is hiring",
    ]
    for pattern in patterns:
        match = re.search(pattern, text[:1000], re.IGNORECASE)
        if match:
            return match.group(1).strip()
            
    return None

def extract_role(text: str) -> str | None:
    # Look for common role title patterns in the first few lines
    lines = text.splitlines()[:20]
    
    keywords = ["Engineer", "Developer", "Manager", "Analyst", "Scientist", "Designer", "Director", "VP", "Lead", "Architect"]
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) > 80:
            continue
        # Check if line contains a strong role keyword and looks like a title
        if any(kw.lower() in line_clean.lower() for kw in keywords):
            # Avoid lines that are full sentences
            if not re.search(r"\b(we are|looking for|you will|responsibilities|requirements)\b", line_clean, re.IGNORECASE):
                return line_clean
                
    # Regex fallback
    match = re.search(r"(?:position|role|title)[:\-\s]+([A-Z][a-zA-Z0-9\s]+?)(?:\n|\.|$)", text[:1000], re.IGNORECASE)
    if match:
        return match.group(1).strip()
        
    return None

def extract_deadline(text: str) -> date | None:
    patterns = [
        r"(?:apply by|deadline|closing date)[:\-\s]+([0-9a-zA-Z\s,]+)",
        r"(?:closes on|applications close)[:\-\s]+([0-9a-zA-Z\s,]+)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1).strip()
            try:
                parsed_date = date_parser.parse(date_str, fuzzy=True)
                return parsed_date.date()
            except ValueError:
                continue
                
    return None

def extract_job_info(jd_text: str) -> ExtractedJobInfo:
    doc = nlp(jd_text[:10000])  # Process up to 10k chars for performance
    
    company = extract_company(jd_text, doc)
    role = extract_role(jd_text)
    deadline = extract_deadline(jd_text)
    
    return ExtractedJobInfo(
        company=company,
        role=role,
        deadline=deadline
    )
