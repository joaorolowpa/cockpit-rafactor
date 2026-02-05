import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FundNoteFileType } from '../../models/funds.model';

@Injectable({
  providedIn: 'root'
})
export class FundsNotesFilesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000/v1/funds-notes/files/types';
  private readonly apiKey = '';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getTypes(): Observable<FundNoteFileType[]> {
    return this.http.get<FundNoteFileType[]>(this.baseUrl, {
      headers: this.getHeaders()
    });
  }

  createType(payload: {
    name: string;
    display_name: string;
    description?: string | null;
  }): Observable<FundNoteFileType> {
    return this.http.post<FundNoteFileType>(this.baseUrl, payload, {
      headers: this.getHeaders()
    });
  }

  deleteType(typeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${typeId}`, {
      headers: this.getHeaders()
    });
  }
}
