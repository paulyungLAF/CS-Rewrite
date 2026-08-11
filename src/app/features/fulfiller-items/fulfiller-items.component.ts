import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ExportService } from '../../shared/services/export.service';
import { CsService, DomSummaryResult } from '../../shared/services/cs.service';

type DomRowStyle = 'row-action' | 'row-warn' | 'row-complete' | '';

interface DomItemRow {
  photo: string;
  buyer: string;
  requester: string;
  requesterNote: string;
  clubName: string;
  itemNumber: string;
  itemDesc: string;
  qty: number;
  total: string;
  requested: string;
  action: number | null;
  needFurtherAction: boolean;
  status: string;
  style: DomRowStyle;
}

interface DomGroup {
  name: string;
  count: number;
  expanded: boolean;
  rows: DomItemRow[];
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
  isExporting = false;
  isLoading = false;
  isStatusModalOpen = false;
  selectedRow: DomItemRow | null = null;
  requestedQtyInput = '';
  selectedDecision = 'approve';
  reviewerNote = '';
  sendBackToApprover = true;

  groups: DomGroup[] = [];

  constructor(
    private readonly exportService: ExportService,
    private readonly csService: CsService
  ) {}

  ngOnInit(): void {
    this.loadDomSummary();
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

  openStatusModal(row: DomItemRow): void {
    this.selectedRow = row;
    this.requestedQtyInput = `${row.qty || ''}`;
    this.selectedDecision = row.status === 'Action' ? 'reject' : 'approve';
    this.reviewerNote = '';
    this.sendBackToApprover = true;
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedRow = null;
  }

  private loadDomSummary(): void {
    this.isLoading = true;
    this.csService
      .getAllDomSummary()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.groups = this.mapToGroups(data);
        },
        error: () => {
          this.groups = [];
        }
      });
  }

  private mapToGroups(data: DomSummaryResult[] | null | undefined): DomGroup[] {
    if (!data || data.length === 0) {
      return [];
    }

    const grouped = new Map<string, DomItemRow[]>();

    for (const item of data) {
      const domName =
        this.readString(item, ['OperationsDistrictVP', 'operationsDistrictVP']) ||
        'Unassigned DOM';
      const action = this.readAction(item);
      const needFurtherAction = this.readBoolean(item, [
        'NeedFurtherAction',
        'needFurtherAction'
      ]);

      const row: DomItemRow = {
        photo: this.readString(item, ['Photo', 'photo']),
        buyer: this.readString(item, ['BuyerID', 'buyerID', 'Buyer', 'buyer']),
        requester: this.readString(item, ['RequestBy', 'RequestedBy', 'requestBy', 'requestedBy']),
        requesterNote: this.readString(item, ['RequesterNote', 'Note', 'requesterNote', 'note']),
        clubName: this.readString(item, ['Location', 'location']),
        itemNumber: this.readString(item, ['ItemNumber', 'itemNumber']),
        itemDesc: this.readString(item, ['DisplayName', 'displayName']),
        qty: this.readNumber(item, ['Qty', 'qty']),
        total: this.readCurrency(item, ['LineTotal', 'lineTotal']),
        requested: this.formatDate(this.readUnknown(item, ['CreatedDate', 'createdDate'])),
        action,
        needFurtherAction,
        status: this.getStatusLabel(action, needFurtherAction),
        style: ''
      };

      const rows = grouped.get(domName) ?? [];
      rows.push(row);
      grouped.set(domName, rows);
    }

    return Array.from(grouped.entries()).map(([name, rows]) => ({
      name,
      count: rows.length,
      expanded: false,
      rows
    }));
  }

  private readString(item: DomSummaryResult, keys: string[]): string {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private readNumber(item: DomSummaryResult, keys: string[]): number {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return 0;
  }

  private readUnknown(item: DomSummaryResult, keys: string[]): unknown {
    for (const key of keys) {
      if (key in item) {
        return item[key];
      }
    }
    return null;
  }

  private readCurrency(item: DomSummaryResult, keys: string[]): string {
    const raw = this.readUnknown(item, keys);
    if (typeof raw === 'number') {
      return `$${raw.toFixed(2)}`;
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
    return '$0.00';
  }

  private formatDate(raw: unknown): string {
    if (typeof raw === 'string') {
      const match = /\/Date\((\d+)\)\//.exec(raw);
      const date = match ? new Date(Number.parseInt(match[1], 10)) : new Date(raw);
      if (!Number.isNaN(date.getTime())) {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    }

    if (typeof raw === 'number' && Number.isFinite(raw)) {
      const date = new Date(raw);
      if (!Number.isNaN(date.getTime())) {
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    }

    return 'N/A';
  }

  private readAction(item: DomSummaryResult): number | null {
    const raw = this.readUnknown(item, ['Action', 'action']);
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
    if (typeof raw === 'string') {
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private getStatusLabel(action: number | null, needFurtherAction: boolean): string {
    if (action === -1) {
      return 'New';
    }
    if (action === 2 && !needFurtherAction) {
      return 'Responded';
    }
    return 'Action';
  }

  private readBoolean(item: DomSummaryResult, keys: string[]): boolean {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          return true;
        }
        if (normalized === 'false' || normalized === '0') {
          return false;
        }
      }
    }
    return false;
  }

  isNewStatus(row: DomItemRow | null): boolean {
    return !!row && row.status === 'New';
  }

  isActionStatus(row: DomItemRow | null): boolean {
    return !!row && row.status === 'Action';
  }

  isRespondedStatus(row: DomItemRow | null): boolean {
    return !!row && row.status === 'Responded';
  }

  noteLength(): number {
    return this.reviewerNote.length;
  }

}
