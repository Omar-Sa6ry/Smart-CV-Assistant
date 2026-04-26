import { ObjectType, Field } from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';

export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

registerEnumType(SuggestionPriority, {
  name: 'SuggestionPriority',
});

@ObjectType()
export class Suggestion {
  @Field()
  sectionName: string;

  @Field(() => SuggestionPriority)
  priority: SuggestionPriority;

  @Field()
  message: string;

  @Field({ nullable: true })
  originalText?: string;

  @Field({ nullable: true })
  suggestedText?: string;
}

@ObjectType()
export class ATSDetails {
  @Field()
  formattingScore: number;

  @Field()
  compatibilityScore: number;

  @Field()
  keywordMatchScore: number;

  @Field()
  structureScore: number;

  @Field()
  keywordsFound: number;

  @Field()
  keywordsMissing: number;

  @Field({ nullable: true })
  foundKeywordsList?: string;

  @Field({ nullable: true })
  missingKeywordsList?: string;

  @Field()
  hasTables: boolean;

  @Field()
  hasImages: boolean;

  @Field()
  hasSpecialChars: boolean;
}

@ObjectType()
export class CompletenessDetails {
  @Field()
  requiredSectionsScore: number;

  @Field()
  optionalSectionsScore: number;

  @Field()
  detailsScore: number;

  @Field()
  consistencyScore: number;

  @Field()
  hasContactInfo: boolean;

  @Field()
  hasExperience: boolean;

  @Field()
  hasEducation: boolean;

  @Field()
  hasSkills: boolean;

  @Field()
  hasSummary: boolean;

  @Field()
  hasCertifications: boolean;

  @Field()
  hasProjects: boolean;

  @Field()
  hasLanguages: boolean;
}

@ObjectType()
export class ContentDetails {
  @Field()
  languageScore: number;

  @Field()
  achievementsScore: number;

  @Field()
  clarityScore: number;

  @Field()
  quantifiableResultsCount: number;

  @Field()
  spellingErrorsCount: number;

  @Field({ nullable: true })
  spellingErrorsList?: string;
}

@ObjectType()
export class AnalysisDto {
  @Field()
  overallScore: number;

  @Field()
  feedbackSummary: string;

  @Field()
  predictedRole: string;

  @Field()
  strengths: string;

  @Field()
  weaknesses: string;

  @Field()
  suggestions: string;

  @Field(() => ATSDetails)
  atsDetails: ATSDetails;

  @Field(() => ContentDetails)
  contentDetails: ContentDetails;

  @Field(() => CompletenessDetails)
  completenessDetails: CompletenessDetails;

  @Field(() => [Suggestion])
  detailedSuggestions: Suggestion[];
}
