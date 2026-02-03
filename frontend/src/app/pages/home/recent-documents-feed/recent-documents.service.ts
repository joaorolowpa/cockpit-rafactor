import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecentDocument {
  id: number;
  company_id: number;
  created_by: number;
  creator_name: string;
  user_email: string;
  text_html: string | null;
  text_markdown: string | null;
  document_type: string;
  date_reference: string;
  file_path: string;
  created_at: string;
  company_name?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RecentDocumentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/v1/companies/milestones-research/files-recent';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getRecentDocuments(limit = 1000, offset = 0): Observable<RecentDocument[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (offset > 0) {
      params = params.set('offset', offset.toString());
    }

    return this.http.get<RecentDocument[]>(this.apiUrl, {
      params,
      headers: this.getHeaders()
    });
  }

  downloadDocument(filePath: string, userId = 1): Observable<Blob> {
    const url = 'http://127.0.0.1:8000/v1/files/download-file';
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('datalake_filepath', filePath);

    return this.http.get(url, {
      params,
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}
