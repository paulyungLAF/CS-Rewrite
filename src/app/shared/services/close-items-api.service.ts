import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';

export interface CloseItemRequest {
  itemNumber: string;
  clubId: string;
  buyer: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloseItemsApiService {
  private readonly controller = 'club-supplies';

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  closeItem(payload: CloseItemRequest): Observable<unknown> {
    const endpoint = this.apiUrlService.buildUrl(this.controller, 'close-item');
    return this.http.post(endpoint, payload);
  }
}
