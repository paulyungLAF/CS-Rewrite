import { Component, ChangeDetectionStrategy, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClubContextService } from '../../shared/services/club-context.service';
import { CsOrderRow, CsService } from '../../shared/services/cs.service';

type RowTone = 'tone-action' | 'tone-pending' | 'tone-receiving' | '';

interface OrderRow {
  photo: string;
  itemDescription: string;
  quantity: number;
  qtyReceived: number;
  requestDate: string;
  orderedDate: string;
  dateReceived: string;
  status: string;
  tone: RowTone;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  templateUrl: './order-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {
  isExecutive = true;
  searchText = '';
  activeInventoryTab: 'order' | 'cooler' | 'retail' = 'order';
  isLoading = false;
  pageSize = 9;
  currentPage = 1;

  private readonly subscription = new Subscription();
  private rows: OrderRow[] = [];

  constructor(
    public clubContext: ClubContextService,
    private readonly csService: CsService
  ) {}

  get visibleRows(): OrderRow[] {
    const term = this.searchText.trim().toLowerCase();
    return term
      ? this.rows.filter((r) => r.itemDescription.toLowerCase().includes(term))
      : this.rows;
  }

  get pagedRows(): OrderRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.visibleRows.slice(start, start + this.pageSize);
  }

  get totalRows(): number {
    return this.visibleRows.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 5) {
      return Array.from({ length: total }, (_, idx) => idx + 1);
    }

    let start = Math.max(1, this.currentPage - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);

    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  get showLeadingEllipsis(): boolean {
    return this.pageNumbers.length > 0 && this.pageNumbers[0] > 2;
  }

  get showTrailingEllipsis(): boolean {
    return this.pageNumbers.length > 0 && this.pageNumbers[this.pageNumbers.length - 1] < this.totalPages - 1;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.clubContext.selectedClubId$.subscribe((clubId) => {
        if (clubId) {
          this.loadOrders(clubId);
        } else {
          this.rows = [];
          this.currentPage = 1;
        }
      })
    );
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.currentPage = 1;
  }

  onPageSizeChange(value: string): void {
    const nextSize = Number.parseInt(value, 10);
    if (Number.isFinite(nextSize) && nextSize > 0) {
      this.pageSize = nextSize;
      this.currentPage = 1;
    }
  }

  goToPage(page: number): void {
    const safePage = Math.min(this.totalPages, Math.max(1, page));
    this.currentPage = safePage;
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  onPhotoLoadError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    image.style.display = 'none';
    const photoWrap = image.closest('.photo-wrap') as HTMLElement | null;
    if (photoWrap) {
      photoWrap.classList.add('photo-wrap--fallback');
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadOrders(clubId: string): void {
    this.isLoading = true;
    this.subscription.add(
      this.csService.getClubSuppliesOrdered(clubId).subscribe({
        next: (rows) => {
          this.rows = this.mapRows(rows);
          this.currentPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.rows = [];
          this.currentPage = 1;
          this.isLoading = false;
        }
      })
    );
  }

  private mapRows(rows: CsOrderRow[] | null | undefined): OrderRow[] {
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row) => {
      const status = this.readString(row, ['Status', 'status']) || 'N/A';
      return {
        photo: this.readString(row, ['PicURL', 'picURL', 'PicUrl', 'picUrl']) || 'N/A',
        itemDescription: this.readString(row, ['GP_ItemDesc', 'gP_ItemDesc']) || 'N/A',
        quantity: this.readNumber(row, ['Qty_Ordered', 'qty_Ordered']),
        qtyReceived: this.readNumber(row, ['Qty_Received', 'qty_Received']),
        requestDate: this.readDate(row, ['ReqDate', 'reqDate']),
        orderedDate: this.readDate(row, ['PoDate', 'PODate', 'poDate']),
        dateReceived: this.readDate(row, ['ReceivedDate', 'receivedDate']),
        status,
        tone: this.getTone(status)
      };
    });
  }

  private readString(row: CsOrderRow, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private readNumber(row: CsOrderRow, keys: string[]): number {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private readDate(row: CsOrderRow, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) {
        return this.formatDate(value);
      }
    }

    return 'N/A';
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  private getTone(status: string): RowTone {
    const normalized = status.toLowerCase();
    if (normalized.includes('action')) {
      return 'tone-action';
    }

    if (normalized.includes('receiv') || normalized.includes('pending')) {
      return 'tone-pending';
    }

    if (normalized.includes('complete')) {
      return 'tone-receiving';
    }

    return '';
  }
}
