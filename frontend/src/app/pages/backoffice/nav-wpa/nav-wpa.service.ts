import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_KEY } from '../../../config/api.config';

export interface WpaPosition {
  position_value_adj: number;
  asset_name: string;
  date_reference: string;
}

export interface NavProfitabilityData {
  month_end: string;
  position_value: number;
  total_inflows: number;
  position_adj_for_inflows: number;
  nav_index: number;
  monthly_profitability: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class BackofficeNavWpaService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = API_KEY;
  private readonly baseUrl = API_BASE_URL;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'x-api-key': this.apiKey
    });
  }

  getWpaPositions(dateReference?: string): Observable<WpaPosition[]> {
    let params = new HttpParams().set('date_type', 'month').set('consolidate', 'false');
    if (dateReference) {
      params = params.set('date_reference', dateReference);
    }
    return this.http.get<WpaPosition[]>(`${this.baseUrl}/v1/wpa-positions/combined/positions`, {
      headers: this.getHeaders(),
      params
    });
  }

  getNavProfitability(dateReference?: string): Observable<NavProfitabilityData[]> {
    let params = new HttpParams();
    if (dateReference) {
      params = params.set('date_reference', dateReference);
    }
    return this.http.get<NavProfitabilityData[]>(
      `${this.baseUrl}/v1/wpa-positions/combined/nav-with-profitability`,
      {
        headers: this.getHeaders(),
        params
      }
    );
  }
}
