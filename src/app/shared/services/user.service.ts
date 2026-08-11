import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';

export interface EmployeeUser {
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly controller = 'Employee';

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getByAdAccount(employeeId: string): Observable<EmployeeUser> {
    const url = this.apiUrlService.buildUrl(this.controller, 'GetByADAccount');
    const params = new HttpParams().set('ad', employeeId);
    return this.http.get<EmployeeUser>(url, { params });
  }
}
