import { AnalysisDto } from '../models/analysis.model';

export interface IAnalysisMapper {
  prepareAiPayload(cv: any): any;
  mapToDto(aiResult: any, savedData?: any): AnalysisDto;
}
