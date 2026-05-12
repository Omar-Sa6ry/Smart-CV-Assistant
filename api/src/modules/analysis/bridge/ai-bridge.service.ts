import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IAiBridgeService } from '../interfaces';

@Injectable()
export class AiBridgeService implements IAiBridgeService {
  private readonly analysisServiceUrl =
    process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';

  async analyzeJson(payload: any) {
    try {
      console.log(`[AiBridge] Sending JSON analysis request to: ${this.analysisServiceUrl}/v1/analyze-cv`);
      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-cv`,
        payload,
        { timeout: 60000 } // 60 seconds timeout
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'analyzeJson');
      throw error;
    }
  }

  async analyzeFile(stream: any, filename: string, mimetype: string) {
    try {
      const Form = require('form-data');
      const formData = new Form();
      formData.append('file', stream, { filename, contentType: mimetype });

      console.log(`[AiBridge] Sending file analysis request to: ${this.analysisServiceUrl}/v1/analyze-file`);
      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-file`,
        formData,
        { 
          headers: { ...formData.getHeaders() },
          timeout: 90000 // 90 seconds timeout for files
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'analyzeFile');
      throw error;
    }
  }

  private handleError(error: any, context: string) {
    if (error.code === 'ECONNABORTED') {
      console.error(`[AiBridge] ${context} error: Timeout reached`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`[AiBridge] ${context} error: Connection refused at ${this.analysisServiceUrl}`);
    } else if (error.response) {
      console.error(`[AiBridge] ${context} error status: ${error.response.status}`);
      console.error(`[AiBridge] ${context} error data:`, error.response.data);
    } else {
      console.error(`[AiBridge] ${context} error:`, error.message);
    }
  }
}
