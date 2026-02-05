import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ColmeiaLatestResponse {
  id?: number;
  payload?: Record<
    string,
    {
      scores?: Record<string, number>;
      justification?: string;
      justification_bullets?: string[];
    }
  >;
  score_final_geral?: number;
  score_por_categoria?: Record<string, number>;
  updated_at?: string;
  created_at?: string;
}

export interface ColmeiaHistoryItem {
  id?: number;
  colmeia_id?: number;
  version?: number;
  created_by_name?: string;
  created_at?: string;
  score_final_geral?: number;
  variacao_vs_ultima_versao?: number | null;
}

export interface ColmeiaHistorySummaryResponse {
  items: ColmeiaHistoryItem[];
  pagination?: {
    limit?: number;
    offset?: number;
    returned?: number;
    has_next?: boolean;
    total_items?: number;
    total_pages?: number;
    current_page?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CompanyColmeiaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/colmeia';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getLatest(companyId: number): Observable<ColmeiaLatestResponse | null> {
    const params = new HttpParams().set('company_id', companyId.toString());
    return this.http.get<ColmeiaLatestResponse>(`${this.baseUrl}/latest`, {
      params,
      headers: this.getHeaders()
    });
  }

  getHistorySummary(
    companyId: number,
    limit = 50,
    offset = 0
  ): Observable<ColmeiaHistorySummaryResponse> {
    const params = new HttpParams()
      .set('company_id', companyId.toString())
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<ColmeiaHistorySummaryResponse>(`${this.baseUrl}/history/summary`, {
      params,
      headers: this.getHeaders()
    });
  }

  deleteColmeia(colmeiaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${colmeiaId}`, {
      headers: this.getHeaders()
    });
  }
}
