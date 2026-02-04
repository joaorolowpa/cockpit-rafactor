import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../../models/companies.model';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/companies';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/companies`, {
      headers: this.getHeaders()
    });
  }
}
