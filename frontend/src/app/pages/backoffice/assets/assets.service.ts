import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL, API_KEY } from '../../../config/api.config';

export interface AssetClassifications {
  columns: string[];
  data: Array<Array<string | number | boolean | null>>;
}

@Injectable({
  providedIn: 'root'
})
export class BackofficeAssetsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/v1/assets`;
  private readonly apiKey = API_KEY;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getClassifications(type: string): Observable<AssetClassifications> {
    return this.http.get<AssetClassifications>(`${this.baseUrl}/classifications/${type}`, {
      headers: this.getHeaders()
    });
  }
}
