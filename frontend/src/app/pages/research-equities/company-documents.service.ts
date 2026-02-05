import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CompanyDocument {
  id: number;
  created_at: string;
  created_by?: number;
  user_name?: string | null;
  user_email?: string | null;
  date_reference?: string | null;
  document_type?: string | null;
  file_path?: string | null;
}

export interface CompanyExcelDocument {
  id: number;
  created_at: string;
  created_by?: number;
  user_name?: string | null;
  user_email?: string | null;
  date_reference?: string | null;
  datalake_filepath?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyDocumentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/companies';
  private readonly v2DocumentsUrl = 'http://127.0.0.1:8000/v2/research/companies/document';
  private readonly v2ExcelUrl = 'http://127.0.0.1:8000/v2/research/companies/excel';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getCompanyDocuments(companyId: number): Observable<CompanyDocument[]> {
    const params = new HttpParams().set('company_id', companyId.toString());
    return this.http
      .get<CompanyDocument[]>(`${this.baseUrl}/milestones-research/documents`, {
        params,
        headers: this.getHeaders()
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            return this.http
              .get<CompanyDocument[]>(`${this.baseUrl}/milestones-research/document`, {
                params,
                headers: this.getHeaders()
              })
              .pipe(
                catchError((err2) => {
                  if (err2?.status === 404) {
                    return this.http.get<CompanyDocument[]>(this.v2DocumentsUrl, {
                      params,
                      headers: this.getHeaders()
                    });
                  }
                  return throwError(() => err2);
                })
              );
          }
          return throwError(() => err);
        })
      );
  }

  getCompanyExcelDocuments(companyId: number): Observable<CompanyExcelDocument[]> {
    const params = new HttpParams().set('company_id', companyId.toString());
    return this.http
      .get<CompanyExcelDocument[]>(`${this.baseUrl}/milestones-research/excel/${companyId}`, {
        headers: this.getHeaders()
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            return this.http
              .get<CompanyExcelDocument[]>(`${this.baseUrl}/milestones-research/excel`, {
                params,
                headers: this.getHeaders()
              })
              .pipe(
                catchError((err2) => {
                  if (err2?.status === 404) {
                    return this.http.get<CompanyExcelDocument[]>(this.v2ExcelUrl, {
                      params,
                      headers: this.getHeaders()
                    });
                  }
                  return throwError(() => err2);
                })
              );
          }
          return throwError(() => err);
        })
      );
  }

  deleteCompanyDocument(documentId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/milestones-research/document/${documentId}`, {
        headers: this.getHeaders()
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            return this.http.delete<void>(`${this.v2DocumentsUrl}/${documentId}`, {
              headers: this.getHeaders()
            });
          }
          return throwError(() => err);
        })
      );
  }

  deleteCompanyExcel(documentId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/milestones-research/excel/${documentId}`, {
        headers: this.getHeaders()
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            return this.http.delete<void>(`${this.v2ExcelUrl}/${documentId}`, {
              headers: this.getHeaders()
            });
          }
          return throwError(() => err);
        })
      );
  }

  downloadDocument(filePath: string, userId = 1): Observable<Blob> {
    const url = 'http://127.0.0.1:8000/v1/files/download-file';
    const fallbackUrl = 'http://127.0.0.1:8000/v2/microservices/download-file';
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('datalake_filepath', filePath);

    return this.http
      .get(url, {
        params,
        headers: this.getHeaders(),
        responseType: 'blob'
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) {
            return this.http.get(fallbackUrl, {
              params,
              headers: this.getHeaders(),
              responseType: 'blob'
            });
          }
          return throwError(() => err);
        })
      );
  }
}
