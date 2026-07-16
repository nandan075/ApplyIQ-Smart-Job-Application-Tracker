from __future__ import annotations

import os
import json
import logging
from typing import Any
from pydantic import BaseModel, Field
from rapidfuzz import process, fuzz
from sentence_transformers import SentenceTransformer
import numpy as np

# Load taxonomy for skill intersection
taxonomy_path = os.path.join(os.path.dirname(__file__), "skills_taxonomy.json")
try:
    with open(taxonomy_path, "r") as f:
        SKILLS_TAXONOMY = json.load(f)
except FileNotFoundError:
    SKILLS_TAXONOMY = {}

ALL_SKILLS = [skill for skills in SKILLS_TAXONOMY.values() for skill in skills]

class ScoreAssets(BaseModel):
    relevance_score: int = Field(ge=0, le=100)
    matched_strengths: list[str] = Field(default_factory=list)
    drawbacks: list[str] = Field(default_factory=list)
    fix_suggestions: list[str] = Field(default_factory=list)

# Load sentence transformer model (downloads on first run)
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    logging.warning(f"Could not load SentenceTransformer: {e}. Semantic scoring will be disabled.")
    model = None

def extract_skills_flat(text: str) -> set[str]:
    # Extract skills for a flat set intersection
    found = set()
    text_lower = text.lower()
    for skill in ALL_SKILLS:
        if f" {skill.lower()} " in f" {text_lower} " or f" {skill.lower()}," in f" {text_lower} ":
             found.add(skill)
    return found

def get_semantic_score(resume_text: str, jd_text: str) -> float:
    if not model:
        return 0.5 # fallback neutral score
        
    embeddings = model.encode([resume_text[:2000], jd_text[:2000]])
    # Compute cosine similarity
    similarity = np.dot(embeddings[0], embeddings[1]) / (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1]))
    return float(similarity)

def score_resume_local(resume_data: dict[str, Any], jd_text: str) -> ScoreAssets:
    # 1. Reconstruct some resume text for semantic scoring
    resume_text_parts = []
    
    skills_data = resume_data.get("skills", [])
    resume_skills = set()
    for cat in skills_data:
        for skill in cat.get("skills", []):
            resume_skills.add(skill)
            
    # Add skills to text
    resume_text_parts.append("Skills: " + ", ".join(resume_skills))
    
    # Add experience to text
    exp_data = resume_data.get("experience", [])
    for exp in exp_data:
        if exp.get("role"): resume_text_parts.append(exp["role"])
        for bullet in exp.get("bullets", []):
             resume_text_parts.append(bullet)
             
    resume_text = "\n".join(resume_text_parts)
    
    # 2. Extract JD Skills
    jd_skills = extract_skills_flat(jd_text)
    
    # 3. Match Skills using fuzzy matching
    matched_skills = set()
    missing_skills = set()
    
    for req_skill in jd_skills:
        # Check if req_skill is fuzzy matched in resume_skills
        match = process.extractOne(req_skill, resume_skills, scorer=fuzz.WRatio)
        if match and match[1] >= 85: # 85% match threshold
            matched_skills.add(req_skill)
        else:
            missing_skills.add(req_skill)
            
    # 4. Calculate Scores
    # Keyword Score (0-100)
    if not jd_skills:
        keyword_score = 100
    else:
        keyword_score = (len(matched_skills) / len(jd_skills)) * 100
        
    # Semantic Score (-1 to 1 -> scaled to 0-100)
    sem_similarity = get_semantic_score(resume_text, jd_text)
    semantic_score = max(0, min(100, (sem_similarity + 0.2) * 100))
    
    # Final Score (Weighted average)
    relevance_score = int(0.6 * keyword_score + 0.4 * semantic_score)
    
    # 5. Generate Assets
    matched_strengths = []
    if matched_skills:
         matched_strengths.append(f"Strong overlap in core technologies: {', '.join(list(matched_skills)[:5])}.")
    if semantic_score > 75:
         matched_strengths.append("Your past experience aligns closely with the overall context and responsibilities of this role.")
         
    drawbacks = []
    if missing_skills:
         drawbacks.append(f"Missing key skills mentioned in JD: {', '.join(list(missing_skills)[:3])}.")
    if semantic_score < 40:
         drawbacks.append("The phrasing of your experience bullets doesn't match the terminology used in the job description.")
         
    fix_suggestions = []
    if missing_skills:
         fix_suggestions.append(f"If you have experience with {list(missing_skills)[0]}, make sure to explicitly add it to your resume.")
    if keyword_score < 50:
         fix_suggestions.append("Try replacing generic verbs with the specific keywords found in the job description.")

    return ScoreAssets(
        relevance_score=relevance_score,
        matched_strengths=matched_strengths if matched_strengths else ["Matches basic criteria."],
        drawbacks=drawbacks if drawbacks else ["No significant drawbacks identified."],
        fix_suggestions=fix_suggestions if fix_suggestions else ["Your resume is well tailored for this role."]
    )
