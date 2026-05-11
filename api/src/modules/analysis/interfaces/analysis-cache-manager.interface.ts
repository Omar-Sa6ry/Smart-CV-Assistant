export interface IAnalysisCacheManager {
  getLatest(userId: string): Promise<any>;
  setLatest(userId: string, data: any): Promise<void>;
  getHistory(userId: string): Promise<any>;
  setHistory(userId: string, data: any): Promise<void>;
  invalidateAll(userId: string): Promise<void>;
}
