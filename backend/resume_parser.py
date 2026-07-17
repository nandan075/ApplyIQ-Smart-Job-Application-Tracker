from __future__ import annotations

import re
import json
import os
from dateutil import parser as date_parser
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None

class SkillCategory(BaseModel):
    category: str
    skills: list[str] = Field(default_factory=list)

class ExperienceItem(BaseModel):
    company: str | None = None
    role: str | None = None
    dates: str | None = None
    bullets: list[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    dates: str | None = None
    details: list[str] = Field(default_factory=list)

class ParsedResume(BaseModel):
    name: str | None = None
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    skills: list[SkillCategory] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)

# Load taxonomy
taxonomy_path = os.path.join(os.path.dirname(__file__), "skills_taxonomy.json")
try:
    with open(taxonomy_path, "r") as f:
        SKILLS_TAXONOMY = json.load(f)
except FileNotFoundError:
    SKILLS_TAXONOMY = {}

def extract_contact_info(text: str) -> ContactInfo:
    lines = text.splitlines()[:20]
    head_text = "\n".join(lines)
    
    email = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", head_text)
    phone = re.search(r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", head_text)
    linkedin = re.search(r"linkedin\.com/in/[\w-]+", head_text)
    github = re.search(r"github\.com/[\w-]+", head_text)
    
    return ContactInfo(
        email=email.group(0) if email else None,
        phone=phone.group(0) if phone else None,
        linkedin=linkedin.group(0) if linkedin else None,
        github=github.group(0) if github else None,
    )

def extract_skills(text: str) -> list[SkillCategory]:
    found_skills = []
    text_lower = text.lower()
    
    for category, skills in SKILLS_TAXONOMY.items():
        cat_skills = []
        for skill in skills:
            # Word boundary search
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, text_lower):
                cat_skills.append(skill)
        if cat_skills:
            found_skills.append(SkillCategory(category=category, skills=cat_skills))
            
    return found_skills

def extract_sections(text: str) -> dict[str, str]:
    # Very basic section header splitting
    sections = {}
    current_section = "header"
    current_content = []
    
    headers = {
        "experience": r"^(?:experience|work history|employment)\s*$",
        "education": r"^(?:education|academic background)\s*$",
        "skills": r"^(?:skills|technologies)\s*$",
        "certifications": r"^(?:certifications|licenses)\s*$"
    }
    
    for line in text.splitlines():
        line_clean = line.strip().lower()
        matched_header = None
        for sec_name, pattern in headers.items():
            if re.match(pattern, line_clean):
                matched_header = sec_name
                break
                
        if matched_header:
            sections[current_section] = "\n".join(current_content)
            current_section = matched_header
            current_content = []
        else:
            current_content.append(line)
            
    sections[current_section] = "\n".join(current_content)
    return sections

def parse_experience(text: str) -> list[ExperienceItem]:
    # Simplified parser: looks for date ranges to split jobs
    items = []
    date_pattern = r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{4}).*?(?:-|to|–).*?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{4}|Present|Current)"
    
    current_item = None
    
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
            
        date_match = re.search(date_pattern, line, re.IGNORECASE)
        if date_match and len(line) < 100:
            if current_item:
                items.append(current_item)
            current_item = ExperienceItem(dates=date_match.group(0), company=line.replace(date_match.group(0), "").strip())
        elif current_item:
            # If it looks like a bullet
            if line.startswith(("-", "•", "*")):
                current_item.bullets.append(line.lstrip("-•* "))
            else:
                # Might be the role title if we don't have bullets yet
                if not current_item.bullets and not current_item.role:
                    current_item.role = line
                else:
                    current_item.bullets.append(line)
                    
    if current_item:
        items.append(current_item)
        
    return items

def parse_resume_local(text: str) -> ParsedResume:
    contact = extract_contact_info(text)
    
    # Try to find name in first few lines (not matching email or phone)
    name = None
    for line in text.splitlines()[:5]:
        line = line.strip()
        if line and len(line.split()) >= 2 and not "@" in line and not re.search(r"\d", line):
            name = line
            break

    skills = extract_skills(text)
    sections = extract_sections(text)
    
    experience_text = sections.get("experience", "")
    experience = parse_experience(experience_text) if experience_text else []
    
    # Minimal education extraction
    education = []
    edu_text = sections.get("education", "")
    if edu_text:
        education.append(EducationItem(institution=edu_text.splitlines()[0] if edu_text else ""))
        
    cert_text = sections.get("certifications", "")
    certifications = [line.strip("-•* ") for line in cert_text.splitlines() if line.strip()]
    
    return ParsedResume(
        name=name,
        contact_info=contact,
        skills=skills,
        experience=experience,
        education=education,
        certifications=certifications
    )
