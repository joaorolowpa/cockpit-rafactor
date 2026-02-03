import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Fund, Relationship, Metrics, GroupedFund, FundClassification, FundManagerContent, FundManagerDetails, FundManagerDocument, FundNote, FundTransaction, RelationshipDetails } from '../../models/funds.model';

@Injectable({
  providedIn: 'root'
})
export class FundsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/funds';
  private readonly apiKey = ''; // Substitua pela sua chave
  private readonly notesUrl = 'http://127.0.0.1:8000/v1/notes/funds/notes';
  private readonly documentsUrl = 'http://127.0.0.1:8000/v1/documents';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getFundManagers(): Observable<Fund[]> {
    console.log('Fetching fund managers from API');
    return this.http.get<Fund[]>(`${this.baseUrl}/fund-managers`, {
      headers: this.getHeaders()
    });
  }

  getFundManagerDetails(fundManagerId: number): Observable<FundManagerDetails> {
    return this.http.get<FundManagerDetails>(`${this.baseUrl}/fund-managers/${fundManagerId}/details`, {
      headers: this.getHeaders()
    });
  }

  updateFundManagerDetails(
    fundManagerId: number,
    payload: FundManagerContent,
    lastUpdatedBy?: string | number
  ): Observable<FundManagerDetails> {
    let params = new HttpParams();
    if (lastUpdatedBy !== undefined && lastUpdatedBy !== null) {
      params = params.set('last_updated_by', String(lastUpdatedBy));
    }

    return this.http.post<FundManagerDetails>(
      `${this.baseUrl}/fund-managers/${fundManagerId}/details`,
      payload,
      {
        params,
        headers: this.getHeaders()
      }
    );
  }

  getRelationships(fundManagerIds: number[]): Observable<Relationship[]> {
    console.log('Fetching relationships for fund manager IDs:', fundManagerIds);
    
    // CORRIGIDO: Envia cada ID como parâmetro separado
    let params = new HttpParams();
    fundManagerIds.forEach(id => {
      params = params.append('fund_manager_ids', id.toString());
    });
    
    return this.http.get<Relationship[]>(`${this.baseUrl}/relationships`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getRelationshipsAll(): Observable<Relationship[]> {
    return this.http.get<Relationship[]>(`${this.baseUrl}/relationships`, {
      headers: this.getHeaders()
    });
  }

  getMetrics(fundManagerIds: number[]): Observable<Metrics[]> {
    console.log('Fetching metrics for fund manager IDs:', fundManagerIds);
    
    // CORRIGIDO: Envia cada ID como parâmetro separado
    let params = new HttpParams();
    fundManagerIds.forEach(id => {
      params = params.append('fund_manager_ids', id.toString());
    });
    
    return this.http.get<Metrics[]>(`${this.baseUrl}/metrics`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getFundsNotes(fundManagerIds: number[]): Observable<FundNote[]> {
    let params = new HttpParams();
    fundManagerIds.forEach(id => {
      params = params.append('fund_manager_ids', id.toString());
    });

    return this.http.get<FundNote[]>(this.notesUrl, {
      params,
      headers: this.getHeaders()
    });
  }

  getFundsManagersDocuments(fundManagerId: number): Observable<FundManagerDocument[]> {
    return this.http.get<FundManagerDocument[]>(`${this.documentsUrl}/fund-managers/${fundManagerId}`, {
      headers: this.getHeaders()
    });
  }

  getFundRelationshipDetails(relationshipId: number): Observable<RelationshipDetails> {
    console.log('entrou aqui?????????')
    return this.http.get<RelationshipDetails>(`${this.baseUrl}/fund-relationships/${relationshipId}/details`, {
      headers: this.getHeaders()
    });
  }

  getFundClassifications(): Observable<FundClassification[]> {
    return this.http.get<FundClassification[]>(`${this.baseUrl}/classifications`, {
      headers: this.getHeaders()
    });
  }

  getFundTransactions(): Observable<FundTransaction[]> {
    return this.http.get<FundTransaction[]>(`${this.baseUrl}/transactions`, {
      headers: this.getHeaders()
    });
  }

  getGroupedFundsData(funds: Fund[]): Observable<GroupedFund[]> {
    const fundIds = funds.map(f => f.id);
    
    return forkJoin({
      relationships: this.getRelationships(fundIds),
      metrics: this.getMetrics(fundIds)
    }).pipe(
      map(({ relationships, metrics }) => {
        return funds.map(fund => {
          const fundRelationships = relationships
            .filter(rel => rel.fund_manager_id === fund.id)
            .map(rel => {
              const metric = metrics.find(
                m => m.relationship_id === Number(rel.id)
              );
              
              return {
                ...rel,
                relationship_metrics: metric
              };
            })
            .filter(rel => rel.relationship_metrics);

          return {
            fundName: fund.display_name,
            relationships: fundRelationships
          };
        }).filter(group => group.relationships.length > 0);
      })
    );
  }
}
