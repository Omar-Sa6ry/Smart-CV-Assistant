import { Injectable } from '@nestjs/common';
import { AnalysisDto, SuggestionPriority } from '../models/analysis.model';
import { IAnalysisMapper } from '../interfaces';

@Injectable()
export class AnalysisMapper implements IAnalysisMapper {
  prepareAiPayload(cv: any) {
    return {
      cvId: cv.id,
      title: cv.title,
      summary: cv.summary,
      email: cv.email || cv.user?.email,
      phone: cv.phone,
      linkedin: cv.linkedin,
      github: cv.github,
      experiences: cv.experiences,
      educations: cv.educations,
      skills: cv.skills,
      projects: cv.projects,
      languages: cv.languages,
      certifications: cv.certifications,
      awards: cv.awards,
    };
  }

  mapToDto(aiResult: any, savedData?: any): AnalysisDto {
    const data = savedData || aiResult;
    return {
      overallScore: Number(data.overallScore),
      feedbackSummary: data.feedbackSummary,
      predictedRole: aiResult.predictedRole || 'Developer',
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      suggestions: data.suggestions,
      atsDetails: {
        ...data.atsDetails,
        formattingScore: Number(data.atsDetails.formattingScore),
        compatibilityScore: Number(data.atsDetails.compatibilityScore),
        keywordMatchScore: Number(data.atsDetails.keywordMatchScore),
        structureScore: Number(data.atsDetails.structureScore),
      } as any,
      contentDetails: {
        ...data.contentDetails,
        languageScore: Number(data.contentDetails.languageScore),
        achievementsScore: Number(data.contentDetails.achievementsScore),
        clarityScore: Number(data.contentDetails.clarityScore),
      } as any,
      completenessDetails: {
        ...data.completenessDetails,
        requiredSectionsScore: Number(
          data.completenessDetails.requiredSectionsScore,
        ),
        optionalSectionsScore: Number(
          data.completenessDetails.optionalSectionsScore,
        ),
        detailsScore: Number(data.completenessDetails.detailsScore),
        consistencyScore: Number(data.completenessDetails.consistencyScore),
        hasAwards: !!data.completenessDetails.hasAwards,
      } as any,
      detailedSuggestions: data.detailedSuggestions.map((s: any) => ({
        ...s,
        priority: s.priority.toLowerCase() as SuggestionPriority,
      })),
    };
  }
}
