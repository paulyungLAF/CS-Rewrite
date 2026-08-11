import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {
  private readonly baseUrl = 'https://sppool.fitnessintl.test/ClubSuppliesRpt-WS/api/';

  getBaseUrl(): string {
    return this.baseUrl;
  }

  buildUrl(controller: string, action: string): string {
    const sanitizedBase = this.baseUrl.replace(/\/+$/, '');
    const sanitizedController = controller.replace(/^\/+|\/+$/g, '');
    const sanitizedAction = action.replace(/^\/+/, '');
    return `${sanitizedBase}/${sanitizedController}/${sanitizedAction}`;
  }
}
