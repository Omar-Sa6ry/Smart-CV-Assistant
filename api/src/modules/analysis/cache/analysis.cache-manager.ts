import { Injectable } from '@nestjs/common';
import { RedisService } from '@bts-soft/core';
import { IAnalysisCacheManager } from '../interfaces';

@Injectable()
export class AnalysisCacheManager implements IAnalysisCacheManager {
  private readonly CACHE_TTL = 86400; // 24h

  constructor(private readonly redisService: RedisService) {}

  private getLatestKey(cvId: string) {
    return `cv_analysis:latest:${cvId}`;
  }
  private getHistoryKey(cvId: string) {
    return `cv_analysis:history:${cvId}`;
  }

  async invalidateAll(cvId: string) {
    try {
      await Promise.all([
        this.redisService.del(this.getLatestKey(cvId)),
        this.redisService.del(this.getHistoryKey(cvId)),
      ]);
    } catch {}
  }

  async getLatest(key: string): Promise<any> {
    try {
      const data = await this.redisService.get(this.getLatestKey(key));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setLatest(key: string, data: any): Promise<void> {
    try {
      await this.redisService.set(
        this.getLatestKey(key),
        JSON.stringify(data),
        this.CACHE_TTL,
      );
    } catch {}
  }

  async getHistory(key: string): Promise<any> {
    try {
      const data = await this.redisService.get(this.getHistoryKey(key));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async setHistory(key: string, data: any): Promise<void> {
    try {
      await this.redisService.set(
        this.getHistoryKey(key),
        JSON.stringify(data),
        this.CACHE_TTL,
      );
    } catch {}
  }
}
