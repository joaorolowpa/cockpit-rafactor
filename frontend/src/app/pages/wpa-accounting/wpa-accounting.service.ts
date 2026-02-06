import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type WpaWeightsResponse = Record<string, Record<string, number>>;

export interface DistinctAssetValue {
  asset_name: string;
  asset_type_name: string;
  wpa_value_in_brl: number | null;
  date_reference: string | null;
  comment?: string | null;
}

export interface GroupedAssetValue {
  asset_type_name: string;
  total_value_sum?: number | null;
  wpa_value_sum: number | null;
}

export interface AssetValue {
  portfolio_name: string;
  portfolio_id: string;
  date_reference: string | null;
  total_original_position: number | null;
  portfolio_original_currency: string | null;
  fx_rate: number | null;
  fx_date_reference: string | null;
  portfolio_new_currency: string | null;
  portfolio_value_in_brl: number | null;
  percentage_ownership: number | null;
  wpa_stake_date_reference: string | null;
  wpa_stake_comment: string | null;
  net_wpa_stake: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class WpaAccountingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://127.0.0.1:8000/v1';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getPortfoliosAvailableDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiBaseUrl}/portfolios/available-dates`, {
      headers: this.getHeaders()
    });
  }

  getAssetsValuesGrouped(dateReference?: string): Observable<GroupedAssetValue[]> {
    return this.http.get<GroupedAssetValue[]>(`${this.apiBaseUrl}/wpa/assets-values/grouped`, {
      params: this.buildDateParams(dateReference),
      headers: this.getHeaders()
    });
  }

  getAssetsValuesDistinct(dateReference?: string): Observable<DistinctAssetValue[]> {
    return this.http.get<DistinctAssetValue[]>(`${this.apiBaseUrl}/wpa/assets-values/distinct`, {
      params: this.buildDateParams(dateReference),
      headers: this.getHeaders()
    });
  }

  getAssetsValuesFundsConsolidated(dateReference?: string): Observable<AssetValue[]> {
    return this.http.get<AssetValue[]>(`${this.apiBaseUrl}/wpa/assets-values/funds-consolidated`, {
      params: this.buildDateParams(dateReference),
      headers: this.getHeaders()
    });
  }

  getWpaWeights(dateReference?: string): Observable<WpaWeightsResponse> {
    return this.http.get<WpaWeightsResponse>(`${this.apiBaseUrl}/nav/exposure/wpa-weights`, {
      params: this.buildDateParams(dateReference),
      headers: this.getHeaders()
    });
  }

  private buildDateParams(dateReference?: string): HttpParams | undefined {
    if (!dateReference) return undefined;
    return new HttpParams().set('date_reference', dateReference);
  }
}
