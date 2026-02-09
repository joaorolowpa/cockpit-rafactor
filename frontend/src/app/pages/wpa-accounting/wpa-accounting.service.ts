import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { API_BASE_URL, API_KEY } from '../../config/api.config';

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

export interface WpaAsset {
  asset_id: number;
  asset_name: string;
  asset_description?: string | null;
  asset_created_at?: string | null;
  asset_type_description?: string | null;
  asset_created_by_name?: string | null;
  asset_created_by_email?: string | null;
}

export interface CreateAssetPayload {
  asset_name: string;
  asset_type_description: string;
  asset_description?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WpaAccountingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${API_BASE_URL}/v1`;
  private readonly apiKey = API_KEY;

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
    const cacheKey = this.buildCacheKey('assets-values-funds-consolidated', dateReference);
    return this.http
      .get<AssetValue[]>(`${this.apiBaseUrl}/wpa/assets-values/funds/consolidated`, {
        params: this.buildDateParams(dateReference),
        headers: this.getHeaders()
      })
      .pipe(
        tap((data) => this.setCache(cacheKey, data)),
        catchError((error) => {
          const cached = this.getCache<AssetValue[]>(cacheKey);
          if (cached) {
            return of(cached);
          }
          return throwError(() => error);
        })
      );
  }

  getWpaWeights(dateReference?: string): Observable<WpaWeightsResponse> {
    return this.http.get<WpaWeightsResponse>(`${this.apiBaseUrl}/nav/exposure/wpa-weights`, {
      params: this.buildDateParams(dateReference),
      headers: this.getHeaders()
    });
  }

  getAssets(): Observable<WpaAsset[]> {
    return this.http.get<WpaAsset[]>(`${this.apiBaseUrl}/wpa/assets`, {
      headers: this.getHeaders()
    });
  }

  createAsset(payload: CreateAssetPayload): Observable<WpaAsset> {
    return this.http.post<WpaAsset>(`${this.apiBaseUrl}/wpa/assets`, payload, {
      headers: this.getHeaders()
    });
  }

  deleteAsset(assetId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/wpa/assets/${assetId}`, {
      headers: this.getHeaders()
    });
  }

  private buildDateParams(dateReference?: string): HttpParams | undefined {
    if (!dateReference) return undefined;
    return new HttpParams().set('date_reference', dateReference);
  }

  private buildCacheKey(scope: string, dateReference?: string): string {
    return `wpa:${scope}:${dateReference ?? 'latest'}`;
  }

  private setCache<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    const payload = {
      savedAt: new Date().toISOString(),
      data
    };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  private getCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { data?: T };
      return parsed?.data ?? null;
    } catch {
      return null;
    }
  }
}
