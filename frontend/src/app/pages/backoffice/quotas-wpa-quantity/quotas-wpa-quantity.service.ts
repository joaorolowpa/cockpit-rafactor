import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_KEY } from '../../../config/api.config';

export interface QuotaAcquisition {
  quota_acquisition_id: number;
  wpa_asset_id: number;
  asset_name: string;
  date_reference: string;
  quantidade_cotas: number;
  valor_cota: number;
  comment: string | null;
}

export interface WpaAssetWithQuota {
  id: number;
  name: string;
}

export interface CreateQuotaAcquisitionPayload {
  wpa_asset_id: number;
  date_reference: string;
  quantidade_cotas: number;
  valor_cota: number;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackofficeQuotasWpaQuantityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/v1/quotas/acquisition`;
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

  getQuotaAcquisitions(): Observable<QuotaAcquisition[]> {
    return this.http.get<QuotaAcquisition[]>(`${this.baseUrl}/wpa`, {
      headers: this.getHeaders()
    });
  }

  getAssetsWithQuota(): Observable<WpaAssetWithQuota[]> {
    return this.http.get<WpaAssetWithQuota[]>(`${this.baseUrl}/assets-with-quota`, {
      headers: this.getHeaders()
    });
  }

  createQuotaAcquisition(payload: CreateQuotaAcquisitionPayload): Observable<unknown> {
    const formData = new FormData();
    formData.append('wpa_asset_id', String(payload.wpa_asset_id));
    formData.append('date_reference', payload.date_reference);
    formData.append('quantidade_cotas', String(payload.quantidade_cotas));
    formData.append('valor_cota', String(payload.valor_cota));
    formData.append('comment', payload.comment ?? '');

    return this.http.post(`${this.baseUrl}/wpa`, formData, {
      headers: this.getHeaders(false)
    });
  }

  deleteQuotaAcquisition(acquisitionId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/wpa/${acquisitionId}`, {
      headers: this.getHeaders()
    });
  }
}
