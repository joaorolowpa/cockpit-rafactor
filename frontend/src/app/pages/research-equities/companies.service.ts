import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  getCompanies(params?: {
    companyIds?: number[];
    displayNames?: string[];
    capitalIQIds?: number[];
    debug?: boolean;
  }): Observable<Company[]> {
    let httpParams = new HttpParams();

    params?.companyIds?.forEach((id) => {
      httpParams = httpParams.append('companyIds', id.toString());
    });

    params?.displayNames?.forEach((name) => {
      httpParams = httpParams.append('displayNames', name);
    });

    params?.capitalIQIds?.forEach((id) => {
      httpParams = httpParams.append('capitalIQIds', id.toString());
    });

    if (params?.debug) {
      httpParams = httpParams.set('debug', 'true');
    }

    return this.http.get<Company[]>(`${this.baseUrl}/companies`, {
      params: httpParams,
      headers: this.getHeaders()
    });
  }

  createCompany(payload: { display_name: string; capital_iq_id: number }): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/companies`, payload, {
      headers: this.getHeaders()
    });
  }

  updateCompany(companyId: number, payload: { display_name: string; capital_iq_id: number }): Observable<Company> {
    return this.http.put<Company>(`${this.baseUrl}/companies/${companyId}`, payload, {
      headers: this.getHeaders()
    });
  }

  deleteCompany(companyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/companies/${companyId}`, {
      headers: this.getHeaders()
    });
  }
}
