import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CloseItemRequest {
  itemNumber: string;
  clubId: string;
  buyer: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloseItemsApiService {
  private readonly closeEndpoint = '/api/club-supplies/close-item';

  constructor(private readonly http: HttpClient) {}

  closeItem(payload: CloseItemRequest): Observable<unknown> {
    return this.http.post(this.closeEndpoint, payload);
  }
}
