from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
import os

app = FastAPI(title="Smart CV Analysis API", version="1.0.0")

# Schemas

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
    foundKeywordsList: Optional[str] = None
    missingKeywordsList: Optional[str] = None
    hasTables: bool
    hasImages: bool
    hasSpecialChars: bool

class ContentDetails(BaseModel):
    languageScore: float
    achievementsScore: float
    clarityScore: float
    quantifiableResultsCount: int
    spellingErrorsCount: int
    spellingErrorsList: Optional[str] = None

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

class AnalysisResponse(BaseModel):
    overallScore: float
    feedbackSummary: str
    predictedRole: str
    strengths: str
    weaknesses: str
    suggestions: str
    atsDetails: ATSDetails
    contentDetails: ContentDetails
    completenessDetails: CompletenessDetails
    detailedSuggestions: List[Suggestion]

# Endpoints

@app.get("/")
async def root():
    return {"message": "Smart CV Analysis Service is running"}

@app.post("/v1/analyze-cv", response_model=AnalysisResponse)
async def analyze_cv(cv_data: dict):
    # ai model

    # Mock Data that matches the Database Schema
    mock_response = {
        "overallScore": 75.5,
        "feedbackSummary": "Your CV is solid but needs more quantifiable achievements.",
        "predictedRole": "Full Stack Developer",
        "strengths": "Strong technical stack, clear education history.",
        "weaknesses": "Missing industry-standard keywords, weak action verbs in experience.",
        "suggestions": "Focus on adding metrics to your job descriptions.",
        "atsDetails": {
            "formattingScore": 85.0,
            "compatibilityScore": 80.0,
            "keywordMatchScore": 65.0,
            "structureScore": 90.0,
            "keywordsFound": 12,
            "keywordsMissing": 5,
            "foundKeywordsList": "React, Node.js, TypeScript, PostgreSQL",
            "missingKeywordsList": "Docker, Kubernetes, Redis, CI/CD",
            "hasTables": False,
            "hasImages": False,
            "hasSpecialChars": False
        },
        "contentDetails": {
            "languageScore": 88.0,
            "achievementsScore": 60.0,
            "clarityScore": 85.0,
            "quantifiableResultsCount": 2,
            "spellingErrorsCount": 0,
            "spellingErrorsList": ""
        },
        "completenessDetails": {
            "requiredSectionsScore": 100.0,
            "optionalSectionsScore": 70.0,
            "detailsScore": 85.0,
            "consistencyScore": 90.0,
            "hasContactInfo": True,
            "hasExperience": True,
            "hasEducation": True,
            "hasSkills": True,
            "hasSummary": True,
            "hasCertifications": False,
            "hasProjects": True,
            "hasLanguages": True
        },
        "detailedSuggestions": [
            {
                "sectionName": "Experience",
                "priority": "high",
                "message": "Use more powerful action verbs.",
                "originalText": "Responsible for maintaining the backend.",
                "suggestedText": "Spearheaded the development and maintenance of high-performance backend systems."
            },
            {
                "sectionName": "Skills",
                "priority": "medium",
                "message": "Add more DevOps related keywords to match your target role.",
                "originalText": None,
                "suggestedText": "Consider adding Docker and CI/CD tools."
            }
        ]
    }
    
    return mock_response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
