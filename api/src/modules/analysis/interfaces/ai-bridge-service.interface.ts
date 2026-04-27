export interface IAiBridgeService {
  analyzeJson(payload: any): Promise<any>;
  analyzeFile(stream: any, filename: string, mimetype: string): Promise<any>;
}
