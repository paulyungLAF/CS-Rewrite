import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, catchError, finalize, of } from 'rxjs';
import { CsService, DomSummaryResult } from '../../shared/services/cs.service';

type DomRowTone = 'row-responded' | 'row-new' | 'row-complete' | '';

interface DomRow {
  photo: string;
  buyer: string;
  poCreator: string;
  spid: string;
  rowID: string;
    clubID: string;
    clubName: string;
  itemNumber: string;
  itemDesc: string;
  qty: string;
  total: string;
  requested: string;
  status: string;
  tone: DomRowTone;
}

interface DomGroup {
  name: string;
  count: number;
  expanded: boolean;
  rows: DomRow[];
}

  interface ModalNoteHistoryRow {
    date: string;
    createdBy: string;
    note: string;
  }

  interface ModalItemHistoryRow {
    orderDate: string;
    receivedDate: string;
    qtyOrdered: string;
    qtyReceived: string;
    status: string;
  }

type Decision = 'approve' | 'reject' | 'further-action' | '';
type NoteTarget = 'requestor' | 'workday' | 'vendor';

@Component({
  selector: 'app-dom-summary',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dom-summary.component.html',
  styleUrls: ['./dom-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DomSummaryComponent implements OnInit, OnDestroy {
  isLoading = false;
  groups: DomGroup[] = [];
  isStatusModalOpen = false;
  selectedRow: DomRow | null = null;
  isModalKkLoading = false;
  isModalRequesterNoteLoading = false;
  isModalNoteHistoryLoading = false;
  isModalOrderHistoryLoading = false;
  modalCheckInsMonFri = 'N/A';
  modalCheckInsSatSun = 'N/A';
  modalRequesterNote = 'N/A';
  modalNoteHistoryRows: ModalNoteHistoryRow[] = [];
  modalItemHistoryRows: ModalItemHistoryRow[] = [];
  requestedQtyInput = '';
  selectedDecision: Decision = 'further-action';
  reviewerNote = '';
  noteTarget: NoteTarget = 'requestor';
  notePlaceholder = 'Note to Requester';
  isReviewerNoteFocused = false;
  sendBackToApprover = false;
  private readonly subscription = new Subscription();

  constructor(private readonly csService: CsService) {}

  ngOnInit(): void {
    this.loadDomSummary();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleGroup(index: number): void {
    this.groups[index].expanded = !this.groups[index].expanded;
  }

  openStatusModal(row: DomRow): void {
    this.selectedRow = row;
    this.requestedQtyInput = `${row.qty || ''}`;
    this.selectedDecision = this.isNewStatus(row) ? '' : 'further-action';
    this.reviewerNote = '';
    this.noteTarget = 'requestor';
    this.notePlaceholder = this.getDefaultNoteText(this.noteTarget);
    this.isReviewerNoteFocused = false;
    this.sendBackToApprover = false;
    this.resetModalData();
    this.loadKkData(row);
    this.loadRequesterNote(row);
    this.loadNoteHistory(row);
    this.loadOrderHistory(row);
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedRow = null;
  }

  isNewStatus(row: DomRow | null): boolean {
    return (row?.status || '').toLowerCase() === 'new';
  }

  isRespondedStatus(row: DomRow | null): boolean {
    return (row?.status || '').toLowerCase() === 'responded';
  }

  isActionStatus(row: DomRow | null): boolean {
    return (row?.status || '').toLowerCase() === 'action';
  }

  noteLength(): number {
    return this.reviewerNote.length;
  }

  get canSaveChanges(): boolean {
    if (!this.selectedDecision) {
      return false;
    }

    if (this.selectedDecision !== 'further-action') {
      return true;
    }

    return this.reviewerNote.trim().length > 0;
  }

  get modalWarningMessage(): string {
    if (this.isNewStatus(this.selectedRow)) {
      return 'Action is required to proceed with this order.';
    }

    return "You can't leave the Notes field blank for further action required.";
  }

  get reviewerNotePlaceholder(): string {
    return this.isReviewerNoteFocused ? '' : this.notePlaceholder;
  }

  setNoteTarget(target: NoteTarget): void {
    this.noteTarget = target;
    this.notePlaceholder = this.getDefaultNoteText(target);
    this.reviewerNote = '';
    this.isReviewerNoteFocused = false;
  }

  onReviewerNoteFocus(): void {
    this.isReviewerNoteFocused = true;
  }

  onReviewerNoteBlur(): void {
    this.isReviewerNoteFocused = false;
  }

  onApprovedQtyChange(value: string): void {
    const normalized = (value || '').trim();

    if (normalized) {
      this.selectedDecision = 'approve';
      return;
    }

    if (this.selectedDecision === 'approve') {
      this.selectedDecision = '';
    }
  }

  private getDefaultNoteText(target: NoteTarget): string {
    if (target === 'requestor') {
      return 'Note to Requester';
    }

    if (target === 'vendor') {
      return 'Note to Vendor';
    }

    return 'Note to Workday Approver';
  }

  private loadRequesterNote(row: DomRow): void {
    if (!row.spid || !row.rowID) {
      this.modalRequesterNote = 'N/A';
      this.isModalRequesterNoteLoading = false;
      return;
    }

    this.isModalRequesterNoteLoading = true;
    this.subscription.add(
      this.csService
        .getItemHist(row.spid, row.rowID)
        .pipe(
          catchError(() => of([] as DomSummaryResult[])),
          finalize(() => {
            this.isModalRequesterNoteLoading = false;
          })
        )
        .subscribe((payload) => {
          this.modalRequesterNote = this.resolveRequesterNote(payload);
        })
    );
  }

  private loadKkData(row: DomRow): void {
    if (!row.clubID) {
      this.modalCheckInsMonFri = 'N/A';
      this.modalCheckInsSatSun = 'N/A';
      this.isModalKkLoading = false;
      return;
    }

    this.isModalKkLoading = true;
    this.subscription.add(
      this.csService
        .getKkData(row.clubID)
        .pipe(
          catchError(() => of([] as DomSummaryResult[])),
          finalize(() => {
            this.isModalKkLoading = false;
          })
        )
        .subscribe((payload) => {
          this.modalCheckInsMonFri = this.readCheckinsValue(payload, ['CheckInsMonFri', 'checkInsMonFri', 'checkinsMonFri'], ['mon', 'fri']);
          this.modalCheckInsSatSun = this.readCheckinsValue(payload, ['CheckInsSatSun', 'checkInsSatSun', 'checkinsSatSun'], ['sat', 'sun']);
        })
    );
  }

  private resolveRequesterNote(payload: unknown): string {
    const rows = this.toArrayPayload(payload);
    for (const row of rows) {
      const note = this.readString(row, ['Note', 'note', 'NOTE']);
      if (note) {
        return note;
      }
    }

    return 'N/A';
  }

  private toArrayPayload(payload: unknown): Array<Record<string, unknown>> {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload.filter((value): value is Record<string, unknown> => !!value && typeof value === 'object');
    }

    if (typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const nested = record['data'] ?? record['result'] ?? record['items'] ?? record['d'];
      if (Array.isArray(nested)) {
        return nested.filter((value): value is Record<string, unknown> => !!value && typeof value === 'object');
      }

      return [record];
    }

    return [];
  }

  onItemClick(event: Event): void {
    event.preventDefault();
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

  private loadDomSummary(): void {
    this.isLoading = true;

    this.csService
      .getAllDomSummary()
      .pipe(
        catchError(() => of([] as DomSummaryResult[])),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((rows) => {
        this.groups = this.mapToGroups(rows);
      });
  }

  private mapToGroups(rows: DomSummaryResult[]): DomGroup[] {
    if (!rows || rows.length === 0) {
      return [];
    }

    const buckets = new Map<string, DomRow[]>();

    for (const row of rows) {
      const groupName =
        this.readString(row, [
          'OperationsDistrictVP',
          'operationsDistrictVP',
          'OperationsDistrictVp',
          'operationsDistrictVp',
          'OperationDistrictVP',
          'operationDistrictVP',
          'OperationDistrictVp',
          'operationDistrictVp'
        ]) || 'Unassigned';

      const mappedRow: DomRow = {
        photo: this.readString(row, ['Photo', 'photo', 'PicURL', 'picURL', 'PicUrl', 'picUrl']) || '',
        buyer: this.readString(row, ['BuyerID', 'buyerID', 'BuyerId', 'buyerId', 'Buyer', 'buyer']) || 'N/A',
        poCreator: this.readString(row, ['POCreator', 'poCreator', 'PoCreator', 'POCREATOR']) || 'N/A',
        spid: this.readIdentifier(row, ['SPID', 'spid']) || '',
        rowID: this.readIdentifier(row, ['RowID', 'rowID', 'RowId', 'rowId']) || '',
        clubID: this.readIdentifier(row, ['ClubID', 'clubID', 'DeptID', 'deptID']) || '',
        clubName: this.readString(row, ['Location', 'location', 'Localtion', 'localtion', 'ClubName', 'clubName']) || 'N/A',
        itemNumber: this.readString(row, ['ItemNumber', 'itemNumber']) || 'N/A',
        itemDesc: this.readString(row, ['ItemDesc', 'itemDesc', 'DisplayName', 'displayName']) || 'N/A',
        qty: this.readNumberString(row, ['Qty', 'qty', 'Quantity', 'quantity']),
        total: this.readCurrency(row, ['LineTotal', 'lineTotal', 'LINETOTAL', 'Total', 'total']),
        requested: this.readDate(row, ['CreatedDate', 'createdDate']),
        status: this.deriveStatusLabel(row),
        tone: this.getRowTone(this.deriveStatusLabel(row))
      };

      const groupRows = buckets.get(groupName) ?? [];
      groupRows.push(mappedRow);
      buckets.set(groupName, groupRows);
    }

    return Array.from(buckets.entries()).map(([name, groupRows], idx) => ({
      name,
      count: groupRows.length,
      expanded: false,
      rows: groupRows
    }));
  }

  private loadNoteHistory(row: DomRow): void {
    if (!row.spid || !row.rowID) {
      this.modalNoteHistoryRows = [];
      this.isModalNoteHistoryLoading = false;
      return;
    }

    this.isModalNoteHistoryLoading = true;
    this.subscription.add(
      this.csService
        .getItemHist(row.spid, row.rowID)
        .pipe(
          catchError(() => of([] as DomSummaryResult[])),
          finalize(() => {
            this.isModalNoteHistoryLoading = false;
          })
        )
        .subscribe((payload) => {
          const rows = this.toArrayPayload(payload);
          this.modalNoteHistoryRows = rows.map((histRow) => ({
            date: this.readDate(histRow, ['CreateDate', 'CreatedDate', 'createDate', 'createdDate']),
            createdBy: this.readString(histRow, ['CreatedBy', 'createdBy', 'Creator', 'creator']) || 'Approver',
            note: this.readString(histRow, ['Note', 'note', 'NOTE']) || 'N/A'
          }));
        })
    );
  }

  private loadOrderHistory(row: DomRow): void {
    if (!row.clubID || !row.itemNumber) {
      this.modalItemHistoryRows = [];
      this.isModalOrderHistoryLoading = false;
      return;
    }

    this.isModalOrderHistoryLoading = true;
    this.subscription.add(
      this.csService
        .getOrderHistByClubItem(row.clubID, row.itemNumber)
        .pipe(
          catchError(() => of([] as DomSummaryResult[])),
          finalize(() => {
            this.isModalOrderHistoryLoading = false;
          })
        )
        .subscribe((payload) => {
          const rows = this.toArrayPayload(payload);
          this.modalItemHistoryRows = rows.map((histRow) => ({
            orderDate: this.readDate(histRow, ['PODATE', 'PODate', 'poDate', 'OrderDate', 'orderDate']),
            receivedDate: this.readDate(histRow, ['RECEIVEDDATE', 'ReceivedDate', 'receivedDate']),
            qtyOrdered: this.readNumberString(histRow, ['QTY_ORDERED', 'Qty_Ordered', 'qtyOrdered', 'OTY_ORDERED']),
            qtyReceived: this.readNumberString(histRow, ['QTY_RECEIVED', 'Qty_Received', 'qtyReceived']),
            status: this.mapOrderHistoryStatus(histRow)
          }));
        })
    );
  }

  private mapOrderHistoryStatus(row: DomSummaryResult): string {
    const action = this.readNumber(row, ['ACTION', 'Action', 'action']);
    if (action === -1) {
      return 'New';
    }

    if (action === 2) {
      return 'Action';
    }

    return this.readString(row, ['Status', 'status']) || 'Pending PO';
  }

  private resetModalData(): void {
    this.modalCheckInsMonFri = 'N/A';
    this.modalCheckInsSatSun = 'N/A';
    this.isModalKkLoading = false;
    this.modalRequesterNote = 'N/A';
    this.isModalRequesterNoteLoading = false;
    this.isModalNoteHistoryLoading = false;
    this.isModalOrderHistoryLoading = false;
    this.modalNoteHistoryRows = [];
    this.modalItemHistoryRows = [];
  }

  private readString(row: DomSummaryResult, keys: string[]): string {
    const normalized = new Map<string, unknown>();
    for (const [key, value] of Object.entries(row)) {
      normalized.set(key.toLowerCase(), value);
    }

    for (const key of keys) {
      const value = normalized.get(key.toLowerCase());
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private readIdentifier(row: DomSummaryResult, keys: string[]): string {
    const normalized = new Map<string, unknown>();
    for (const [key, value] of Object.entries(row)) {
      normalized.set(key.toLowerCase(), value);
    }

    for (const key of keys) {
      const value = normalized.get(key.toLowerCase());
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}`;
      }
    }

    return '';
  }

  private readNumberString(row: DomSummaryResult, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}`;
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '0';
  }

  private readCurrency(row: DomSummaryResult, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `$${value.toFixed(2)}`;
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return 'N/A';
  }

  private readDate(row: DomSummaryResult, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
        }
        return value.trim();
      }
    }

    return 'N/A';
  }

  private getRowTone(status: string): DomRowTone {
    const normalized = status.toLowerCase();

    if (normalized.includes('respond')) {
      return 'row-responded';
    }

    if (normalized.includes('new')) {
      return 'row-new';
    }

    if (normalized.includes('action')) {
      return 'row-complete';
    }

    return '';
  }

  private deriveStatusLabel(row: DomSummaryResult): string {
    const action = this.readNumber(row, ['Action', 'action']);
    const needFurtherAction = this.readBoolean(row, [
      'NeedFurtheredAction',
      'needFurtheredAction',
      'NeedFurtherAction',
      'needFurtherAction'
    ]);

    if (action === -1) {
      return 'New';
    }

    if (action === 2 && needFurtherAction !== true) {
      return 'Responded';
    }

    return 'Action';
  }

  private readNumber(row: DomSummaryResult, keys: string[]): number | null {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private readBoolean(row: DomSummaryResult, keys: string[]): boolean | null {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'number') {
        if (value === 1) {
          return true;
        }

        if (value === 0) {
          return false;
        }
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y') {
          return true;
        }

        if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'n') {
          return false;
        }
      }
    }

    return null;
  }

  private readCheckinsValue(payload: unknown, keys: string[], labelTokens: string[]): string {
    const rows = this.toArrayPayload(payload);

    for (const row of rows) {
      const direct = this.readString(row, keys);
      if (direct) {
        return direct;
      }
    }

    for (const row of rows) {
      const label = this.readString(row, ['MetricName', 'Label', 'Name', 'CheckInType', 'Type', 'Description']).toLowerCase();
      if (!labelTokens.every((token) => label.includes(token))) {
        continue;
      }

      const value = this.readString(row, ['Value', 'Average', 'ThreeWeekAvg', 'CheckIns', 'Count']) ||
        this.readNumberString(row, ['Value', 'Average', 'ThreeWeekAvg', 'CheckIns', 'Count']);
      if (value) {
        return value;
      }
    }

    return 'N/A';
  }
}
