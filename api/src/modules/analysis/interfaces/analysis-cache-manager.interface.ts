export interface IAnalysisCacheManager {
  getLatest(cvId: string): Promise<any>;
  setLatest(cvId: string, data: any): Promise<void>;
  getHistory(cvId: string): Promise<any>;
  setHistory(cvId: string, data: any): Promise<void>;
  invalidateAll(cvId: string): Promise<void>;
}
