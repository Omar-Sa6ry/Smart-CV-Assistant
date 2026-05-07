import { AnalysisResponse } from '../dtos/analysis.response';
import { AnalysisHistoryResponse } from '../dtos/analysisHistory.response';
import { FileUpload } from 'graphql-upload-ts';

export interface IAnalysisService {
  triggerAnalysis(cvId: string, userId: string): Promise<AnalysisResponse>;
  analyzeUploadedCv(file: FileUpload, userId: string): Promise<AnalysisResponse>;
  getLatestAnalysis(cvId: string, userId: string): Promise<AnalysisResponse>;
  getAnalysisHistory(cvId: string, userId: string): Promise<AnalysisHistoryResponse>;
}
