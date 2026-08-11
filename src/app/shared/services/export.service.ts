import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiUrlService } from './api-url.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  exportUnfulfilledToExcel(reportType: number, unfulfilledSnapshot: unknown): Observable<void> {
    const controller = reportType === 2 ? 'CSItem' : 'FulFiller';
    const url = this.apiUrlService.buildUrl(controller, 'GetExcel');

    return this.http.post(url, unfulfilledSnapshot, { responseType: 'text' }).pipe(
      tap((filePath) => {
        if (filePath && filePath.includes('xlsx')) {
          setTimeout(() => {
            const fileHandlerUrl = this.getFileHandlerUrl(filePath);
            window.open(fileHandlerUrl, '_blank');
          }, 500);
        }
      }),
      map(() => void 0)
    );
  }

  private getFileHandlerUrl(filePath: string): string {
    const serviceRoot = this.apiUrlService.getBaseUrl().replace(/api\/?$/, '');
    return `${serviceRoot}FileHandler.ashx?tempFile=true&filePath=${encodeURIComponent(filePath)}`;
  }
}
