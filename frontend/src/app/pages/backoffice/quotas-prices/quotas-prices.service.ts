import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_KEY } from '../../../config/api.config';

export interface QuotaPrice {
  id: number;
  portfolio_id: number;
  milestones_name: string;
  date_reference: string;
  price_quota: number;
  active: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class BackofficeQuotasPricesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/v1/portfolios-quotas-prices`;
  private readonly apiKey = API_KEY;

  private getHeaders(includeJson = true): HttpHeaders {
    const headers: Record<string, string> = {
      'api-key': this.apiKey,
      'x-api-key': this.apiKey
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    return new HttpHeaders(headers);
  }

  getQuotaPrices(): Observable<QuotaPrice[]> {
    return this.http.get<QuotaPrice[]>(`${this.baseUrl}/prices`, {
      headers: this.getHeaders()
    });
  }

  uploadQuotaPrices(formData: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/upload-xlsx`, formData, {
      headers: this.getHeaders(false)
    });
  }
}
