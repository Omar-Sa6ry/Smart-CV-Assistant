import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IAiBridgeService } from '../interfaces';

@Injectable()
export class AiBridgeService implements IAiBridgeService {
  private readonly analysisServiceUrl =
    process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';

  async analyzeJson(payload: any) {
    const response = await axios.post(
      `${this.analysisServiceUrl}/v1/analyze-cv`,
      payload,
    );
    return response.data;
  }

  async analyzeFile(stream: any, filename: string, mimetype: string) {
    const formData = new (require('form-data'))();
    formData.append('file', stream, { filename, contentType: mimetype });

    const response = await axios.post(
      `${this.analysisServiceUrl}/v1/analyze-file`,
      formData,
      { headers: { ...formData.getHeaders() } },
    );
    return response.data;
  }
}
