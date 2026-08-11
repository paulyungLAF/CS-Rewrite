import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrlService } from './api-url.service';

export interface Club {
  [key: string]: unknown;
}

export interface ClubApprover {
  [key: string]: unknown;
}

export interface ClubVendor {
  [key: string]: unknown;
}

export interface ClubInfo {
  clubID: number;
  localtion: string | null;
}

export interface UnFulfilledItem {
  [key: string]: unknown;
}

interface SupervisorViewRawRow {
  SPID?: unknown;
  RowID?: unknown;
  ClubName?: unknown;
  OperationsDistrictVP?: unknown;
  Vendor?: unknown;
  ItemNumber?: unknown;
  DisplayName?: unknown;
  Qty?: unknown;
  Received?: unknown;
  CreatedDate?: string | null;
  Status?: unknown;
  OrderNumber?: unknown;
  TrackingNumber?: unknown;
}

export interface SupervisorViewRow {
  SPID: unknown;
  RowID: unknown;
  ClubName: unknown;
  DOM: unknown;
  Vendor: unknown;
  ItemNumber: unknown;
  DisplayName: unknown;
  Qty: unknown;
  Received: unknown;
  CreatedDate: string;
  Status: unknown;
  OrderNumber: unknown;
  TrackingNumber: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private clubsList: Club[] = [];
  private approversList: ClubApprover[] = [];
  private vendorsList: ClubVendor[] = [];
  private clubInfo: ClubInfo = { clubID: 0, localtion: null };
  private unFulFilledItems: UnFulfilledItem[] = [];
  private searchResult: SupervisorViewRawRow[] = [];
  private recommendedQty = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  initClubs(): Observable<void> {
    if (this.clubsList.length > 0) {
      return of(void 0);
    }

    const url = this.apiUrlService.buildUrl('Club', 'GetAllClubs');
    return this.http.get<Club[]>(url).pipe(
      tap((data) => {
        this.clubsList = data ?? [];
      }),
      map(() => void 0)
    );
  }

  getClubs(): Club[] {
    return this.clubsList;
  }

  queryClubsApprovers(): Observable<void> {
    const url = this.apiUrlService.buildUrl('Club', 'GetClubsApprovers');
    return this.http.get<ClubApprover[]>(url).pipe(
      tap((data) => {
        this.approversList = data ?? [];
      }),
      map(() => void 0)
    );
  }

  getClubsApprovers(): ClubApprover[] {
    return this.approversList;
  }

  queryClubInfo(): Observable<void> {
    this.clubInfo = { clubID: 0, localtion: null };
    return of(void 0);
  }

  getClubInfo(): ClubInfo {
    return this.clubInfo;
  }

  queryClubsVendors(): Observable<void> {
    const url = this.apiUrlService.buildUrl('Club', 'GetClubsVendors');
    return this.http.get<ClubVendor[]>(url).pipe(
      tap((data) => {
        this.vendorsList = data ?? [];
      }),
      map(() => void 0)
    );
  }

  getClubsVendors(): ClubVendor[] {
    return this.vendorsList;
  }

  queryUnFulFilledItems(adAccount: string): Observable<void> {
    const url = this.apiUrlService.buildUrl('FulFiller', 'GetUnFulFilledItemsByAD');
    const params = new HttpParams().set('ADAccount', adAccount);

    return this.http.get<UnFulfilledItem[]>(url, { params }).pipe(
      tap((data) => {
        this.unFulFilledItems = data ?? [];
      }),
      map(() => void 0)
    );
  }

  getUnFulFilledItems(): UnFulfilledItem[] {
    return this.unFulFilledItems;
  }

  queryMyView(
    startDate: string,
    endDate: string,
    buyerId: string,
    statusId: string,
    category: string | null
  ): Observable<void> {
    const serviceRoot = this.apiUrlService.getBaseUrl().replace(/api\/?$/, '');
    const url = `${serviceRoot}CSreport/GetSupervisorView`;

    let params = new HttpParams()
      .set('SD', startDate)
      .set('ED', endDate)
      .set('BuyerID', buyerId)
      .set('StatusID', statusId);

    if (category !== null) {
      params = params.set('Cat', category);
    }

    return this.http.get<SupervisorViewRawRow[]>(url, { params }).pipe(
      tap((data) => {
        this.searchResult = data ?? [];
      }),
      map(() => void 0)
    );
  }

  getSearchResult(): SupervisorViewRow[] {
    return this.searchResult.map((item) => ({
      SPID: item.SPID,
      RowID: item.RowID,
      ClubName: item.ClubName,
      DOM: item.OperationsDistrictVP,
      Vendor: item.Vendor,
      ItemNumber: item.ItemNumber,
      DisplayName: item.DisplayName,
      Qty: item.Qty,
      Received: item.Received,
      CreatedDate: this.formatDotNetDate(item.CreatedDate),
      Status: item.Status,
      OrderNumber: item.OrderNumber,
      TrackingNumber: item.TrackingNumber
    }));
  }

  queryPTQ(clubId: string): Observable<void> {
    if (!clubId) {
      return of(void 0);
    }

    const url = this.apiUrlService.buildUrl('CSItem', 'GetPTQuantity');
    const params = new HttpParams().set('ClubID', clubId);

    return this.http.get<number>(url, { params }).pipe(
      tap((data) => {
        this.recommendedQty = typeof data === 'number' ? data : 0;
      }),
      map(() => void 0)
    );
  }

  getRecommendedQty(): number {
    return this.recommendedQty;
  }

  private formatDotNetDate(value: string | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

    const ticks = value.replace('/Date(', '').replace(')/', '');
    const timestamp = Number.parseInt(ticks, 10);

    if (Number.isNaN(timestamp)) {
      return 'N/A';
    }

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
}
