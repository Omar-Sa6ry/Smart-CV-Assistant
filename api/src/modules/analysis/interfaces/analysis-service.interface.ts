import { AnalysisResponse } from '../dtos/analysis.response';
import { AnalysisHistoryResponse } from '../dtos/analysisHistory.response';
import * as UploadMinimal from 'graphql-upload-minimal';

export interface IAnalysisService {
  triggerAnalysis(cvId: string, userId: string): Promise<AnalysisResponse>;
  analyzeUploadedCv(file: UploadMinimal.FileUpload, userId: string): Promise<AnalysisResponse>;
  getLatestAnalysis(userId: string): Promise<AnalysisResponse>;
  getAnalysisHistory(userId: string): Promise<AnalysisHistoryResponse>;
}
