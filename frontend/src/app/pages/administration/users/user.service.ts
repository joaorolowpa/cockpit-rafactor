import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserDto, UpdateUserDto } from '../../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/v1/users/';
  private readonly apiKey = ''; // Substitua pela sua chave

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getUsers(
    userActive: boolean = true,
    roleActive: boolean = true,
    userEmail?: string,
    tableColumns?: string[]
  ): Observable<User[]> {
    let params = new HttpParams()
      .set('user_active', userActive.toString())
      .set('role_active', roleActive.toString());

    if (userEmail) {
      params = params.set('user_email', userEmail);
    }

    if (tableColumns && tableColumns.length > 0) {
      tableColumns.forEach(col => {
        params = params.append('table_columns', col);
      });
    }

    return this.http.get<User[]>(this.apiUrl, { 
      params,
      headers: this.getHeaders()
    });
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, {
      headers: this.getHeaders()
    });
  }

  updateUser(user: UpdateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, {
      headers: this.getHeaders()
    });
  }
}