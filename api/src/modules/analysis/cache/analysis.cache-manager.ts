import { Injectable } from '@nestjs/common';
import { RedisService } from '@bts-soft/core';
import { IAnalysisCacheManager } from '../interfaces';

@Injectable()
export class AnalysisCacheManager implements IAnalysisCacheManager {
  private readonly CACHE_TTL = 86400; // 24h

  constructor(private readonly redisService: RedisService) {}

  private getLatestKey(cvId: string) { return `cv_analysis:latest:${cvId}`; }
  private getHistoryKey(cvId: string) { return `cv_analysis:history:${cvId}`; }

  async getLatest(cvId: string) {
    try { return await this.redisService.get(this.getLatestKey(cvId)); } catch { return null; }
  }

  async setLatest(cvId: string, data: any) {
    try { await this.redisService.set(this.getLatestKey(cvId), data, this.CACHE_TTL); } catch {}
  }

  async getHistory(cvId: string) {
    try { return await this.redisService.get(this.getHistoryKey(cvId)); } catch { return null; }
  }

  async setHistory(cvId: string, data: any) {
    try { await this.redisService.set(this.getHistoryKey(cvId), data, this.CACHE_TTL); } catch {}
  }

  async invalidateAll(cvId: string) {
    try {
      await Promise.all([
        this.redisService.del(this.getLatestKey(cvId)),
        this.redisService.del(this.getHistoryKey(cvId)),
      ]);
    } catch {}
  }
}
