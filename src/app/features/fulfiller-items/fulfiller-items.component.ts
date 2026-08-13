import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CsService } from '../../shared/services/cs.service';
import { ExportService } from '../../shared/services/export.service';

interface FulfillerItemRow {
  deptID: string;
  vendor: string;
  item: string;
  qty: string;
  approved: string;
  orderNumber: string;
  trackingNumber: string;
  orderInput: string;
  trackingInput: string;
}

interface FulfillerClubGroup {
  clubName: string;
  count: number;
  expanded: boolean;
  rows: FulfillerItemRow[];
}

@Component({
  selector: 'app-fulfiller-items',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fulfiller-items.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./fulfiller-items.component.scss']
})
export class FulfillerItemsComponent implements OnInit {
  private static readonly AD_ACCOUNT = '1913312';

  isExporting = false;
  isLoading = false;
  groups: FulfillerClubGroup[] = [];

  constructor(
    private readonly exportService: ExportService,
    private readonly csService: CsService
  ) {}

  ngOnInit(): void {
    this.loadFulfillerItems();
  }

  exportToExcel(): void {
    if (this.isExporting) {
      return;
    }

    this.isExporting = true;
    this.exportService
      .exportUnfulfilledToExcel(1, this.groups)
      .pipe(finalize(() => (this.isExporting = false)))
      .subscribe({
        error: () => {
          // Keep UX minimal for now; a shared notification service can be wired later.
        }
      });
  }

  toggleGroup(index: number): void {
    this.groups[index].expanded = !this.groups[index].expanded;
  }

  markOrderVerified(row: FulfillerItemRow): void {
    if (!row.orderInput.trim() && row.orderNumber) {
      row.orderInput = row.orderNumber;
    }
  }

  markFulfilled(row: FulfillerItemRow): void {
    if (!row.trackingInput.trim() && row.trackingNumber) {
      row.trackingInput = row.trackingNumber;
    }
  }

  private loadFulfillerItems(): void {
    this.isLoading = true;
    this.csService
      .getUnFulFilledItemsByAD(FulfillerItemsComponent.AD_ACCOUNT)
      .pipe(
        catchError(() => of(null)),
        finalize(() => (this.isLoading = false))
      )
      .subscribe((payload) => {
        this.groups = this.mapToClubGroups(payload);
      });
  }

  private mapToClubGroups(payload: unknown): FulfillerClubGroup[] {
    const rows = this.extractAllObjects(payload);

    if (rows.length === 0) {
      return [];
    }

    const grouped = new Map<string, FulfillerItemRow[]>();

    for (const row of rows) {
      const clubName = this.readDisplayValue(row, [
        'ClubName',
        'clubName',
        'Location',
        'location',
        'Localtion',
        'localtion',
        'Club',
        'club'
      ]);

      if (!clubName) {
        continue;
      }

      const mappedRow: FulfillerItemRow = {
        deptID: this.readDisplayValue(row, ['DeptID', 'deptID', 'DepartmentID', 'departmentID', 'ClubID', 'clubID']) || 'N/A',
        vendor: this.readDisplayValue(row, ['Vendor', 'vendor']) || 'N/A',
        item: this.readDisplayValue(row, ['DisplayName', 'displayName', 'Item', 'item', 'ItemDesc', 'itemDesc']) || 'N/A',
        qty: this.readDisplayValue(row, ['Qty', 'qty', 'Quantity', 'quantity']) || '0',
        approved: this.formatDate(this.readRawValue(row, ['CreatedDate', 'createdDate', 'ApprovedDate', 'approvedDate'])),
        orderNumber: this.readDisplayValue(row, ['OrderNumber', 'orderNumber', 'PO', 'po']) || '',
        trackingNumber: this.readDisplayValue(row, ['TrackingNumber', 'trackingNumber', 'Tracking', 'tracking']) || '',
        orderInput: this.readDisplayValue(row, ['OrderNumber', 'orderNumber', 'PO', 'po']) || '',
        trackingInput: this.readDisplayValue(row, ['TrackingNumber', 'trackingNumber', 'Tracking', 'tracking']) || ''
      };

      const bucket = grouped.get(clubName) ?? [];
      bucket.push(mappedRow);
      grouped.set(clubName, bucket);
    }

    return Array.from(grouped.entries()).map(([clubName, clubRows]) => ({
      clubName,
      count: clubRows.length,
      expanded: false,
      rows: clubRows
    }));
  }

  private extractAllObjects(payload: unknown): Array<{ [key: string]: unknown }> {
    const queue: unknown[] = [payload];
    const objects: Array<{ [key: string]: unknown }> = [];

    while (queue.length > 0) {
      const candidate = queue.shift();
      if (!candidate) {
        continue;
      }

      if (Array.isArray(candidate)) {
        queue.push(...candidate);
        continue;
      }

      if (typeof candidate !== 'object') {
        continue;
      }

      const item = candidate as { [key: string]: unknown };
      objects.push(item);

      for (const value of Object.values(item)) {
        if (Array.isArray(value) || (value && typeof value === 'object')) {
          queue.push(value);
        }
      }
    }

    return objects;
  }

  private readDisplayValue(row: { [key: string]: unknown }, keys: string[]): string {
    const value = this.readRawValue(row, keys);

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${value}`;
    }

    return '';
  }

  private readRawValue(row: { [key: string]: unknown }, keys: string[]): unknown {
    const normalized = new Map<string, unknown>();
    for (const key of Object.keys(row)) {
      normalized.set(key.toLowerCase(), row[key]);
    }

    for (const key of keys) {
      if (normalized.has(key.toLowerCase())) {
        return normalized.get(key.toLowerCase());
      }
    }

    return null;
  }

  private formatDate(raw: unknown): string {
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        return 'N/A';
      }

      const match = /\/Date\((\d+)\)\//.exec(trimmed);
      const parsed = match ? new Date(Number.parseInt(match[1], 10)) : new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
      }
      return 'N/A';
    }

    if (typeof raw === 'number' && Number.isFinite(raw)) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
      }
    }

    return 'N/A';
  }
}
