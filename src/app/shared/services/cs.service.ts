import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';

export interface CsOrderRow {
  [key: string]: unknown;
}

export interface ClubNameResult {
  [key: string]: unknown;
}

export interface PermissionResult {
  [key: string]: unknown;
}

export interface PendingItemResult {
  [key: string]: unknown;
}

export interface RejectedItemResult {
  [key: string]: unknown;
}

export interface LineItemNoteResult {
  [key: string]: unknown;
}

export interface DomSummaryResult {
  [key: string]: unknown;
}

export interface ItemHistoryResult {
  [key: string]: unknown;
}

export interface OrderHistoryResult {
  [key: string]: unknown;
}

export interface KkDataResult {
  [key: string]: unknown;
}

export interface FulFillerItemResult {
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class CsService {
  private rejectedItems: RejectedItemResult[] = [];
  private readonly domSummaryUrl =
    'http://sppool.fitnessintl.test/ClubSuppliesRpt-WS/api/Approver/GetAllDOMSummary';

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getOrdersByDeptID(pathOrQuery: string): Observable<CsOrderRow[]> {
    const url = this.resolveCsReportUrl(pathOrQuery);
    return this.http.get<CsOrderRow[]>(url);
  }

  getClubNameByID(clubID: string): Observable<ClubNameResult> {
    const url = this.apiUrlService.buildUrl('Club', 'GetClubNameByID');
    const params = new HttpParams().set('clubID', clubID);
    return this.http.get<ClubNameResult>(url, { params });
  }

  getPermissions(adAccount: string): Observable<PermissionResult[]> {
    // This endpoint is intentionally outside the /api segment.
    const nonApiRoot = this.apiUrlService.getBaseUrl().replace(/api\/?$/i, '');
    const url = `${nonApiRoot}Permission/GetBuyerIDsByAD`;
    const params = new HttpParams().set('ad', adAccount);
    return this.http.get<PermissionResult[]>(url, { params });
  }

  getPendingItemByBuyerList(buyerList: string): Observable<PendingItemResult[]> {
    const url = this.apiUrlService.buildUrl('Approver', 'GetApproverPendingItems');
    const params = new HttpParams().set('approverTypeList', buyerList);
    return this.http.get<PendingItemResult[]>(url, { params });
  }

  getRejectedItemByClubID(clubID: string): Observable<RejectedItemResult[]> {
    const serviceRoot = this.getServiceRoot();
    const url = `${serviceRoot}CSReport/GetRejectedItems`;
    const params = new HttpParams().set('clubID', clubID);

    return new Observable<RejectedItemResult[]>((observer) => {
      this.http.get<RejectedItemResult[]>(url, { params }).subscribe({
        next: (data) => {
          this.rejectedItems = data ?? [];
          observer.next(this.rejectedItems);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getLineItemNotes(spid: string, rowID: string): Observable<LineItemNoteResult[]> {
    const serviceRoot = this.getServiceRoot();
    const url = `${serviceRoot}CSReport/GetLineItemNotes`;
    const params = new HttpParams().set('SPID', spid).set('RowID', rowID);
    return this.http.get<LineItemNoteResult[]>(url, { params });
  }

  getAllDomSummary(): Observable<DomSummaryResult[]> {
    return this.http.get<DomSummaryResult[]>(this.domSummaryUrl);
  }

  getItemHist(spid: string, rowID: string): Observable<ItemHistoryResult[]> {
    const serviceRoot = this.getServiceRoot();
    const url = `${serviceRoot}CSReport/GetItemHist`;
    const params = new HttpParams().set('SPID', spid).set('RowID', rowID);
    return this.http.get<ItemHistoryResult[]>(url, { params });
  }

  getOrderHistByClubItem(clubID: string, itemNumber: string): Observable<OrderHistoryResult[]> {
    const url = this.apiUrlService.buildUrl('CSItem', 'GetOrderHistByClubItem');
    const params = new HttpParams().set('clubID', clubID).set('itemNumber', itemNumber);
    return this.http.get<OrderHistoryResult[]>(url, { params });
  }

  getKkData(clubID: string): Observable<KkDataResult[]> {
    const serviceRoot = this.getServiceRoot();
    const url = `${serviceRoot}CSReport/GetKKData`;
    const params = new HttpParams().set('ClubID', clubID);
    return this.http.get<KkDataResult[]>(url, { params });
  }

  getClubSuppliesOrdered(clubID: string): Observable<CsOrderRow[]> {
    const serviceRoot = this.getServiceRoot();
    const url = `${serviceRoot}CSReport/GetClubSuppliesOrdered`;
    const params = new HttpParams().set('clubID', clubID);
    return this.http.get<CsOrderRow[]>(url, { params });
  }

  getUnFulFilledItemsByAD(adAccount: string): Observable<FulFillerItemResult[]> {
    const url = this.apiUrlService.buildUrl('FulFiller', 'GetUnFulFilledItemsByAD');
    const params = new HttpParams().set('ADAccount', adAccount);
    return this.http.get<FulFillerItemResult[]>(url, { params });
  }

  private getServiceRoot(): string {
    return this.apiUrlService.getBaseUrl().replace(/api\/?$/, '');
  }

  private resolveCsReportUrl(pathOrQuery: string): string {
    if (/^https?:\/\//i.test(pathOrQuery)) {
      return pathOrQuery;
    }

    const csReportRoot = `${this.getServiceRoot()}CSReport/`;
    return `${csReportRoot}${pathOrQuery.replace(/^\/+/, '')}`;
  }
}
