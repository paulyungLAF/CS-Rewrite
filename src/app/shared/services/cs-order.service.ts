import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrlService } from './api-url.service';

export interface CsItem {
  [key: string]: unknown;
}

export interface ClubItemOrderHistory {
  [key: string]: unknown;
}

export interface CsOrderPayload {
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class CsOrderService {
  private csItems: CsItem[] = [];
  private csClubItemOrderHist: ClubItemOrderHistory[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getOrdersByDeptID(deptId: string): Observable<unknown> {
    const serviceRoot = this.apiUrlService.getBaseUrl().replace(/api\/?$/, '');
    const url = `${serviceRoot}CSReport/GetClubSuppliesOrdered`;
    const params = new HttpParams().set('deptID', deptId);

    return this.http.get<unknown>(url, { params });
  }

  queryItemsByTypeAndClub(jobTitle: string, clubID: string): Observable<CsItem[]> {
    const url = this.apiUrlService.buildUrl('CSItem', 'GetAll');
    const params = new HttpParams().set('jobTitle', jobTitle).set('clubID', clubID);

    return this.http.get<CsItem[]>(url, { params }).pipe(
      tap((data) => {
        this.csItems = data ?? [];
      })
    );
  }

  getItems(): CsItem[] {
    return this.csItems;
  }

  getItems2(_jobTitle: string, _isExecutive: boolean): CsItem[] {
    return this.csItems;
  }

  getItemsHist(): ClubItemOrderHistory[] {
    return this.csClubItemOrderHist;
  }

  placeOrder(order: CsOrderPayload | null): Observable<void> {
    if (!order) {
      return throwError(() => new Error('Order payload is required.'));
    }

    const url = this.apiUrlService.buildUrl('CSItem', 'CreateOrder');
    return this.http.post<unknown>(url, order).pipe(map(() => void 0));
  }

  removeLineItem(spid: string, rowid?: string): Observable<void> {
    const url = this.apiUrlService.buildUrl('CSItem', 'RemoveLineItem');
    let params = new HttpParams().set('spid', spid);

    if (rowid) {
      params = params.set('rowid', rowid);
    }

    return this.http.get<unknown>(url, { params }).pipe(map(() => void 0));
  }

  queryItemsOrderHistByClub(clubID: string, itemNumber: string): Observable<ClubItemOrderHistory[]> {
    const url = this.apiUrlService.buildUrl('CSItem', 'GetOrderHistByClubItem');
    const params = new HttpParams().set('clubID', clubID).set('itemNumber', itemNumber);

    return this.http.get<ClubItemOrderHistory[]>(url, { params }).pipe(
      tap((data) => {
        this.csClubItemOrderHist = data ?? [];
      })
    );
  }
}
