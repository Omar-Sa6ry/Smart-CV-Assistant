export interface IAnalysisRepository {
  findLatest(cvId: string, userId: string): Promise<any>;
  findHistory(cvId: string, userId: string): Promise<any[]>;
  saveFullAnalysis(cvId: string, userId: string, aiResult: any, improvement: number, previousScore: number | null): Promise<any>;
}
