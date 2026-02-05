import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CompanyFinancialsKind = 'raw' | 'growth' | 'metrics';

@Injectable({
  providedIn: 'root'
})
export class CompanyFinancialsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/companies/milestones-research/financials';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getCompanyFinancials(companyId: number, kind: CompanyFinancialsKind): Observable<unknown[]> {
    const params = new HttpParams().set('company_id', companyId.toString());
    return this.http.get<unknown[]>(`${this.baseUrl}/${kind}`, {
      params,
      headers: this.getHeaders()
    });
  }
}
