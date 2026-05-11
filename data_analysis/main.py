import sys
import os
import io
import re
import joblib
import numpy as np
import shutil
import tempfile
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict

# Import extraction logic from run_cv_analysis or local
try:
    from engine import analyze_cv_engine
    from train_model_v2 import normalize_text, NORMALIZE_MAP
    from run_cv_analysis import extract_text
except ImportError:
    # Fallback paths
    ENGINE_PATH = os.path.abspath(os.path.join(os.getcwd(), "..", "ai_models", "analysis"))
    if ENGINE_PATH not in sys.path: sys.path.append(ENGINE_PATH)
    from engine import analyze_cv_engine
    from train_model_v2 import normalize_text, NORMALIZE_MAP
    from run_cv_analysis import extract_text

app = FastAPI(title="Smart CV Analysis API")
from starlette.middleware.base import BaseHTTPMiddleware

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)

# Paths
MODEL_DIR = ENGINE_PATH
MODEL_PATH = os.path.join(MODEL_DIR, 'resume_model_v2.pkl')
ENCODER_PATH = os.path.join(MODEL_DIR, 'label_encoder_v2.pkl')

print(f"DEBUG: ENGINE_PATH is {ENGINE_PATH}")
print(f"DEBUG: Checking for MODEL_PATH at {MODEL_PATH}")
print(f"DEBUG: Checking for ENCODER_PATH at {ENCODER_PATH}")

def get_model():
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")
    
    try:
        print(f"DEBUG: Loading model from {MODEL_PATH}...")
        model = joblib.load(MODEL_PATH)
        print(f"DEBUG: Loading encoder from {ENCODER_PATH}...")
        le = joblib.load(ENCODER_PATH)
        print("DEBUG: Model and encoder loaded successfully.")
        return model, le
    except Exception as e:
        print(f"ERROR: Failed to load model or encoder: {e}")
        import traceback
        traceback.print_exc()
        raise e


# ── Schemas ───────────────────────────────────────────────────────────────────

class ExperienceItem(BaseModel):
    title: Optional[str]
    company: Optional[str]
    description: Optional[str]

class CVPayload(BaseModel):
    fullName: Optional[str] = ""
    summary: Optional[str] = ""
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    education: List[Dict] = []
    projects: List[Dict] = []

# Output Schemas (matching required target schemas)
class Suggestion(BaseModel):
    sectionName: str
    priority: str # 'high', 'medium', 'low'
    message: str
    originalText: Optional[str] = None
    suggestedText: Optional[str] = None

class ATSDetails(BaseModel):
    formattingScore: float
    compatibilityScore: float
    keywordMatchScore: float
    structureScore: float
    keywordsFound: int
    keywordsMissing: int
    foundKeywordsList: List[str] = []
    missingKeywordsList: List[str] = []
    hasTables: bool
    hasImages: bool
    hasSpecialChars: bool

class ContentDetails(BaseModel):
    languageScore: float
    achievementsScore: float
    clarityScore: float
    quantifiableResultsCount: int
    spellingErrorsCount: int
    spellingErrorsList: List[str] = []

class CompletenessDetails(BaseModel):
    requiredSectionsScore: float
    optionalSectionsScore: float
    detailsScore: float
    consistencyScore: float
    hasContactInfo: bool
    hasExperience: bool
    hasEducation: bool
    hasSkills: bool
    hasSummary: bool
    hasCertifications: bool
    hasProjects: bool
    hasLanguages: bool
    hasAwards: bool

class AnalysisResponse(BaseModel):
    overallScore: float
    feedbackSummary: str
    predictedRole: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    atsDetails: ATSDetails
    contentDetails: ContentDetails
    completenessDetails: CompletenessDetails
    detailedSuggestions: List[Suggestion]

# ── Helpers ───────────────────────────────────────────────────────────────────

def build_text_from_payload(p: CVPayload) -> str:
    text = f"{p.fullName}\n{p.summary}\n"
    text += "Skills: " + ", ".join(p.skills) + "\n"
    for exp in p.experience:
        text += f"Experience: {exp.title} at {exp.company}\n{exp.description}\n"
    for edu in p.education:
        text += f"Education: {edu.get('degree')} at {edu.get('institution')}\n"
    for proj in p.projects:
        text += f"Project: {proj.get('name')}\n{proj.get('description')}\n"
    return text

def format_engine_response(role: str, confidence: float, results: dict) -> dict:
    missing_list = results['missing_ranked']
    found_list = results['found_skills']
    spelling_errors = results.get("spelling_errors", [])
    
    # Detailed suggestions mapping
    detailed_suggestions = []
    for sugg in results.get("detailed_suggestions", []):
        detailed_suggestions.append(Suggestion(
            sectionName=sugg["sectionName"],
            priority=sugg["priority"].lower(),
            message=sugg["message"],
            originalText=sugg.get("originalText"),
            suggestedText=sugg.get("suggestedText")
        ))
        
    ats_details = ATSDetails(
        formattingScore=results.get("formatting_score", 90.0),
        compatibilityScore=results["kw_score"],
        keywordMatchScore=results["kw_score"],
        structureScore=results["req_score"],
        keywordsFound=len(results["found_skills"]),
        keywordsMissing=len(results["missing_ranked"]),
        foundKeywordsList=found_list,
        missingKeywordsList=missing_list,
        hasTables=results.get("has_tables", False),
        hasImages=results.get("has_images", False),
        hasSpecialChars=results.get("has_special_chars", False)
    )
    
    content_details = ContentDetails(
        languageScore=results["lang_score"],
        achievementsScore=results["impact_score"],
        clarityScore=results["lang_score"],
        quantifiableResultsCount=results["metric_count"],
        spellingErrorsCount=len(spelling_errors),
        spellingErrorsList=spelling_errors
    )
    
    completeness_details = CompletenessDetails(
        requiredSectionsScore=results["req_score"],
        optionalSectionsScore=results["req_score"],
        detailsScore=results.get("details_score", 85.0),
        consistencyScore=results.get("consistency_score", 90.0),
        hasContactInfo=results["contact_info"]["email"] and results["contact_info"]["phone"],
        hasExperience=results["sec_status"]["Experience"],
        hasEducation=results["sec_status"]["Education"],
        hasSkills=results["sec_status"]["Skills"],
        hasSummary=results["sec_status"]["Summary"],
        hasCertifications=results["has_certs"],
        hasProjects=results["sec_status"]["Projects"],
        hasLanguages=results["has_langs"],
        hasAwards=results["has_awards"]
    )
    
    # Suggestions list (combine missing core skills into a suggestion)
    suggestions = []
    if missing_list:
        suggestions.append(f"Add missing core skills: {', '.join(missing_list[:5])}")
    else:
        suggestions.append("Looks good!")

    response = AnalysisResponse(
        overallScore=results["overallScore"],
        feedbackSummary=f"Your CV matches the {role} role with {round(confidence, 1)}% confidence. It has an ATS score of {results['overallScore']}/100.",
        predictedRole=role,
        strengths=found_list[:5],
        weaknesses=missing_list[:5],
        suggestions=suggestions,
        atsDetails=ats_details,
        contentDetails=content_details,
        completenessDetails=completeness_details,
        detailedSuggestions=detailed_suggestions
    )
    
    # Return as dict, wrapped with success true
    res_dict = response.model_dump()
    res_dict["success"] = True
    res_dict["confidence"] = round(confidence, 1)
    
    return res_dict

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "healthy", "engine": "v2-Ultra"}

@app.post("/v1/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    try:
        model, le = get_model()
        
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # Extract Text
        full_text = extract_text(tmp_path)
        os.unlink(tmp_path) # cleanup
        
        if not full_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        # Predict Role
        norm_text = normalize_text(full_text)
        probs = model.predict_proba([norm_text])[0]
        pred_id = np.argmax(probs)
        confidence = float(probs[pred_id]) * 100
        role = le.inverse_transform([pred_id])[0]
        
        # Analysis
        print(f"DEBUG: Calling analyze_cv_engine for role {role}")
        results = analyze_cv_engine(full_text, role, normalize_text, NORMALIZE_MAP)

        # Format response
        return format_engine_response(role, confidence, results)
        
    except Exception as e:
        import traceback
        print(f"ERROR DURING FILE ANALYSIS:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/analyze-cv")
async def analyze_cv(payload: CVPayload = Body(...)):
    try:
        model, le = get_model()
        full_text = build_text_from_payload(payload)
        
        # Predict Role
        norm_text = normalize_text(full_text)
        probs = model.predict_proba([norm_text])[0]
        pred_id = np.argmax(probs)
        confidence = float(probs[pred_id]) * 100
        role = le.inverse_transform([pred_id])[0]
        
        # Analysis
        results = analyze_cv_engine(full_text, role, normalize_text, NORMALIZE_MAP)

        # Format response
        return format_engine_response(role, confidence, results)
        
    except Exception as e:
        import traceback
        print(f"ERROR DURING JSON ANALYSIS:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
