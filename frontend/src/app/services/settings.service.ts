import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { SettingsInfo } from '../models/settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  async fetchSettings(): Promise<SettingsInfo> {
    return await lastValueFrom(
      this.http.get<SettingsInfo>(this.apiService.endpoints.settings)
    );
  }

  async updatePrompt(prompt: string): Promise<string> {
    const data = await lastValueFrom(
      this.http.post<{ role_llm_prompt: string }>(
        this.apiService.endpoints.prompt,
        { prompt }
      )
    );
    return data.role_llm_prompt;
  }
}
