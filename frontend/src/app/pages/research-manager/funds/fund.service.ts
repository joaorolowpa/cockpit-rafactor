import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Fund {
  id: number;
  display_name: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/funds';
  private readonly apiKey = ''; // ✅ Substitua pela sua chave

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getFundsManagers(): Observable<Fund[]> {
    console.log('Fetching fund managers from API');
    return this.http.get<Fund[]>(`${this.baseUrl}/fund-managers`, {
      headers: this.getHeaders()
    });
  }
}