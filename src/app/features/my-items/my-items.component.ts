import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { catchError, finalize, map, switchMap, timeout } from 'rxjs/operators';
import { ClubContextService } from '../../shared/services/club-context.service';
import {
  CsService,
  ItemHistoryResult,
  KkDataResult,
  OrderHistoryResult,
  PendingItemResult,
  PermissionResult
} from '../../shared/services/cs.service';

interface MyItemRow {
  photoUrl: string;
  actionCode: number | null;
  buyer: string;
  requester: string;
  requesterNote: string;
  spid: string;
  rowID: string;
  clubID: string;
  clubName: string;
  itemNumber: string;
  itemDesc: string;
  qty: number;
  requested: string;
  total: string;
  status: string;
}

interface ClubAccordion {
  club: string;
  count: number;
  expanded: boolean;
  rows: MyItemRow[];
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

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './my-items.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./my-items.component.scss']
})
export class MyItemsComponent implements OnInit, OnDestroy {
  private static readonly AD_ACCOUNT = '1913312';
  private static readonly REQUEST_TIMEOUT_MS = 15000;

  bulkApproval = false;
  isLoading = false;
  errorMessage = '';
  isStatusModalOpen = false;
  selectedRow: MyItemRow | null = null;
  requestedQtyInput = '';
  selectedDecision: 'approve' | 'reject' | 'further-action' | '' = 'further-action';
  reviewerNote = '';
  noteTarget: 'requestor' | 'workday' | 'vendor' = 'workday';
  notePlaceholder = 'Note to Workday Approver';
  isReviewerNoteFocused = false;
  isModalKkLoading = false;
  isModalRequesterNoteLoading = false;
  isModalNoteHistoryLoading = false;
  isModalOrderHistoryLoading = false;
  modalRequesterNote = 'N/A';
  modalCheckInsMonFri = 'N/A';
  modalCheckInsSatSun = 'N/A';
  modalNoteHistoryRows: ModalNoteHistoryRow[] = [];
  modalItemHistoryRows: ModalItemHistoryRow[] = [];
  activeTab: 'all' | 'need-respond' = 'need-respond';
  allClubs: ClubAccordion[] = [];
  needRespondClubs: ClubAccordion[] = [];
  private readonly subscription = new Subscription();

  constructor(
    private readonly csService: CsService,
    private readonly clubContext: ClubContextService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.clubContext.clubs.length === 0) {
      this.clubContext.loadClubs();
    }
    this.loadMyItems();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get clubs(): ClubAccordion[] {
    return this.activeTab === 'need-respond' ? this.needRespondClubs : this.allClubs;
  }

  get allClubCount(): number {
    return this.allClubs.length;
  }

  get needRespondClubCount(): number {
    return this.needRespondClubs.length;
  }

  selectTab(tab: 'all' | 'need-respond'): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.ensureExpandedForTab(tab);
    this.syncView();
  }

  toggleClub(index: number): void {
    if (this.activeTab === 'need-respond') {
      this.needRespondClubs = this.needRespondClubs.map((club, clubIndex) => {
        if (clubIndex !== index) {
          return club;
        }

        return {
          ...club,
          expanded: !club.expanded
        };
      });
    } else {
      this.allClubs = this.allClubs.map((club, clubIndex) => {
        if (clubIndex !== index) {
          return club;
        }

        return {
          ...club,
          expanded: !club.expanded
        };
      });
    }

    this.syncView();
  }

  openStatusModal(row: MyItemRow): void {
    this.selectedRow = row;
    this.requestedQtyInput = `${row.qty || ''}`;
    this.selectedDecision = row.status === 'New' ? '' : 'further-action';
    this.noteTarget = 'workday';
    this.notePlaceholder = this.getDefaultNoteText(this.noteTarget);
    this.reviewerNote = '';
    this.isReviewerNoteFocused = false;
    this.modalRequesterNote = row.requesterNote || 'N/A';
    this.resetModalKkData();
    this.isStatusModalOpen = true;
    this.loadKkData(row);
    this.loadRequesterNote(row);
    this.loadNoteHistory(row);
    this.loadOrderHistory(row);
    this.syncView();
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedRow = null;
    this.resetModalKkData();
    this.syncView();
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
    if (this.selectedRow?.status === 'New') {
      return 'Action is required to proceed with this order.';
    }

    return "You can't leave the Notes field blank for further action required.";
  }

  setNoteTarget(target: 'requestor' | 'workday' | 'vendor'): void {
    this.noteTarget = target;
    this.notePlaceholder = this.getDefaultNoteText(target);
    this.reviewerNote = '';
    this.isReviewerNoteFocused = false;
    this.syncView();
  }

  onReviewerNoteFocus(): void {
    this.isReviewerNoteFocused = true;
    this.syncView();
  }

  onReviewerNoteBlur(): void {
    this.isReviewerNoteFocused = false;
    this.syncView();
  }

  get reviewerNotePlaceholder(): string {
    return this.isReviewerNoteFocused ? '' : this.notePlaceholder;
  }

  private getDefaultNoteText(target: 'requestor' | 'workday' | 'vendor'): string {
    if (target === 'requestor') {
      return 'Note to Requestor';
    }

    if (target === 'vendor') {
      return 'Note to Vendor';
    }

    return 'Note to Workday Approver';
  }

  private resetModalKkData(): void {
    this.isModalKkLoading = false;
    this.isModalRequesterNoteLoading = false;
    this.isModalNoteHistoryLoading = false;
    this.isModalOrderHistoryLoading = false;
    this.modalRequesterNote = 'N/A';
    this.modalCheckInsMonFri = 'N/A';
    this.modalCheckInsSatSun = 'N/A';
    this.modalNoteHistoryRows = [];
    this.modalItemHistoryRows = [];
  }

  private loadOrderHistory(row: MyItemRow): void {
    const clubId = this.resolveClubIdForModal(row);
    if (!clubId || !row.itemNumber) {
      return;
    }

    this.isModalOrderHistoryLoading = true;
    this.syncView();

    this.subscription.add(
      this.csService
        .getOrderHistByClubItem(clubId, row.itemNumber)
        .pipe(
          timeout(MyItemsComponent.REQUEST_TIMEOUT_MS),
          catchError(() => of([] as OrderHistoryResult[])),
          finalize(() => {
            this.isModalOrderHistoryLoading = false;
            this.syncView();
          })
        )
        .subscribe((orderHist) => {
          this.modalItemHistoryRows = this.mapOrderHistory(orderHist);
          this.syncView();
        })
    );
  }

  private loadNoteHistory(row: MyItemRow): void {
    if (!row.spid || !row.rowID) {
      return;
    }

    this.isModalNoteHistoryLoading = true;
    this.syncView();

    this.subscription.add(
      this.csService
        .getItemHist(row.spid, row.rowID)
        .pipe(
          timeout(MyItemsComponent.REQUEST_TIMEOUT_MS),
          catchError(() => of([] as ItemHistoryResult[])),
          finalize(() => {
            this.isModalNoteHistoryLoading = false;
            this.syncView();
          })
        )
        .subscribe((itemHist) => {
          this.modalNoteHistoryRows = this.mapNoteHistory(itemHist);
          if (this.modalRequesterNote === 'N/A') {
            const earliestNote = this.resolveEarliestNoteFromItemHist(itemHist);
            if (earliestNote) {
              this.modalRequesterNote = earliestNote;
            }
          }
          this.syncView();
        })
    );
  }

  private loadRequesterNote(row: MyItemRow): void {
    if (!row.spid || !row.rowID) {
      return;
    }

    this.isModalRequesterNoteLoading = true;
    this.syncView();

    this.subscription.add(
      this.csService
        .getItemHist(row.spid, row.rowID)
        .pipe(
          timeout(MyItemsComponent.REQUEST_TIMEOUT_MS),
          catchError(() => of([] as ItemHistoryResult[])),
          finalize(() => {
            this.isModalRequesterNoteLoading = false;
            this.syncView();
          })
        )
        .subscribe((itemHist) => {
          const resolvedNote = this.resolveEarliestNoteFromItemHist(itemHist);
          if (resolvedNote) {
            this.modalRequesterNote = resolvedNote;
          }
          this.syncView();
        })
    );
  }

  private loadKkData(row: MyItemRow): void {
    const clubId = this.resolveClubIdForModal(row);
    if (!clubId) {
      return;
    }

    this.isModalKkLoading = true;
    this.syncView();

    this.subscription.add(
      this.csService
        .getKkData(clubId)
        .pipe(
          timeout(MyItemsComponent.REQUEST_TIMEOUT_MS),
          catchError(() => of([] as KkDataResult[])),
          finalize(() => {
            this.isModalKkLoading = false;
            this.syncView();
          })
        )
        .subscribe((kkData) => {
          this.modalCheckInsMonFri = this.readCheckinsValue(kkData, ['CheckInsMonFri', 'checkInsMonFri', 'checkinsMonFri'], ['mon', 'fri']);
          this.modalCheckInsSatSun = this.readCheckinsValue(kkData, ['CheckInsSatSun', 'checkInsSatSun', 'checkinsSatSun'], ['sat', 'sun']);
          this.syncView();
        })
    );
  }

  private loadMyItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.syncView();

    this.subscription.add(
      this.csService
        .getPermissions(MyItemsComponent.AD_ACCOUNT)
        .pipe(
          timeout(MyItemsComponent.REQUEST_TIMEOUT_MS),
          map((rows) => this.buildApproverTypeList(rows)),
          switchMap((approverTypeList) => {
            if (!approverTypeList) {
              return of([] as PendingItemResult[]);
            }

            return this.csService
              .getPendingItemByBuyerList(approverTypeList)
              .pipe(timeout(MyItemsComponent.REQUEST_TIMEOUT_MS));
          }),
          catchError(() => {
            this.errorMessage = 'Unable to load My Items data. Request timed out or failed.';
            this.allClubs = [];
            this.needRespondClubs = [];
            this.syncView();
            return of([] as PendingItemResult[]);
          }),
          finalize(() => {
            this.isLoading = false;
            this.syncView();
          })
        )
        .subscribe({
          next: (rows) => {
            try {
              const mappedClubs = this.mapToClubs(rows);
              this.allClubs = mappedClubs;
              this.needRespondClubs = this.mapToNeedRespondClubs(mappedClubs);
              this.ensureExpandedForTab(this.activeTab);
            } catch {
              this.errorMessage = 'Unable to load My Items data. Response format was unexpected.';
              this.allClubs = [];
              this.needRespondClubs = [];
            }

            this.syncView();
          },
          error: () => {
            this.errorMessage = 'Unable to load My Items data.';
            this.allClubs = [];
            this.needRespondClubs = [];
            this.syncView();
          }
        })
    );
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }

  private buildApproverTypeList(rows: PermissionResult[] | null | undefined): string {
    if (!rows || rows.length === 0) {
      return '';
    }

    const approverTypes = new Set<string>();
    for (const row of rows) {
      const buyerId = this.readString(row, ['BuyerID', 'buyerID', 'BuyerId', 'buyerId']);
      if (buyerId) {
        approverTypes.add(buyerId.toUpperCase());
      }
    }

    return Array.from(approverTypes).join('|');
  }

  private mapToClubs(rows: PendingItemResult[] | null | undefined): ClubAccordion[] {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const grouped = new Map<string, MyItemRow[]>();

    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue;
      }

      const clubName = this.readString(row, ['ClubName', 'clubName', 'Location', 'location']) || 'Unknown Club';
      const clubRows = grouped.get(clubName) ?? [];
      clubRows.push(this.mapRow(row));
      grouped.set(clubName, clubRows);
    }

    return Array.from(grouped.entries())
      .map(([club, clubRows]) => ({
        club,
        count: clubRows.length,
        expanded: false,
        rows: clubRows
      }))
      .sort((a, b) => a.club.localeCompare(b.club));
  }

  private mapToNeedRespondClubs(clubs: ClubAccordion[]): ClubAccordion[] {
    const filteredClubs: ClubAccordion[] = [];

    for (const club of clubs) {
      const filteredRows = club.rows.filter((row) => row.actionCode !== -1);
      if (filteredRows.length === 0) {
        continue;
      }

      filteredClubs.push({
        club: club.club,
        count: filteredRows.length,
        expanded: false,
        rows: filteredRows
      });
    }

    return filteredClubs;
  }

  private ensureExpandedForTab(tab: 'all' | 'need-respond'): void {
    if (tab === 'need-respond') {
      if (this.needRespondClubs.length > 0 && !this.needRespondClubs.some((club) => club.expanded)) {
        this.needRespondClubs = this.needRespondClubs.map((club, index) => ({
          ...club,
          expanded: index === 0
        }));
      }

      return;
    }

    if (this.allClubs.length > 0 && !this.allClubs.some((club) => club.expanded)) {
      this.allClubs = this.allClubs.map((club, index) => ({
        ...club,
        expanded: index === 0
      }));
    }
  }

  private mapRow(row: PendingItemResult): MyItemRow {
    const actionCode = this.readActionCode(row);
    const status = actionCode === -1 ? 'New' : 'Action';

    return {
      photoUrl: this.readString(row, ['Photo', 'photo', 'PicURL', 'picURL', 'PicUrl', 'picUrl']),
      actionCode,
      buyer: this.readString(row, ['BuyerID', 'buyerID', 'Buyer', 'buyer']) || 'N/A',
      requester:
        this.readString(row, [
          'POCreator',
          'poCreator',
          'RequestBy',
          'RequestedBy',
          'requestBy',
          'requestedBy'
        ]) || 'N/A',
      requesterNote: this.readString(row, ['RequesterNote', 'requesterNote', 'Note', 'note']) || 'N/A',
      spid: this.readIdentifier(row, ['SPID', 'spid']),
      rowID: this.readIdentifier(row, ['RowID', 'rowID', 'RowId', 'rowId']),
      clubID: this.readIdentifier(row, [
        'ClubID',
        'clubID',
        'ClubId',
        'clubId',
        'ClubNo',
        'clubNo',
        'ClubNumber',
        'clubNumber',
        'LocationID',
        'locationID',
        'LocationId',
        'locationId'
      ]),
      clubName: this.readString(row, ['ClubName', 'clubName', 'Location', 'location']) || 'Unknown Club',
      itemNumber: this.readString(row, ['ItemNo', 'itemNo', 'ItemNumber', 'itemNumber', 'GP_ItemNo', 'gP_ItemNo']) || 'N/A',
      itemDesc: this.readString(row, ['DisplayName', 'displayName', 'GP_ItemDesc', 'gP_ItemDesc', 'ItemDesc', 'itemDesc']) || 'N/A',
      qty: this.readNumber(row, ['Qty', 'qty', 'Quantity', 'quantity', 'Qty_Ordered', 'qty_Ordered']),
      requested: this.readDate(row, ['REQDATE', 'reqDate', 'ReqDate', 'RequestedDate', 'requestedDate']),
      total: this.readCurrency(row, ['LINETOTAL', 'lineTotal', 'LineTotal', 'Total', 'total', 'ExtendedCost', 'extendedCost', 'Amount', 'amount']),
      status
    };
  }

  private readActionCode(row: PendingItemResult): number | null {
    const rawActionValues = [row['ACTION'], row['Action'], row['action']];

    for (const rawValue of rawActionValues) {
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return rawValue;
      }

      if (typeof rawValue === 'string' && rawValue.trim()) {
        const parsed = Number(rawValue.trim());
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
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

  private readString(row: Record<string, unknown> | null | undefined, keys: string[]): string {
    if (!row) {
      return '';
    }

    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private readNumber(row: Record<string, unknown> | null | undefined, keys: string[]): number {
    if (!row) {
      return 0;
    }

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

  private readIdentifier(row: Record<string, unknown> | null | undefined, keys: string[]): string {
    if (!row) {
      return '';
    }

    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}`;
      }
    }

    return '';
  }

  private readDate(row: Record<string, unknown> | null | undefined, keys: string[]): string {
    const raw = this.readString(row, keys);
    if (!raw) {
      return 'N/A';
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  private readCurrency(row: Record<string, unknown> | null | undefined, keys: string[]): string {
    if (!row) {
      return '$0.00';
    }

    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `$${value.toFixed(2)}`;
      }

      if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        if (trimmed.startsWith('$')) {
          return trimmed;
        }

        const parsed = Number(trimmed.replace(/,/g, ''));
        if (Number.isFinite(parsed)) {
          return `$${parsed.toFixed(2)}`;
        }

        return trimmed;
      }
    }

    return '$0.00';
  }

  private resolveClubIdForModal(row: MyItemRow): string {
    if (row.clubID) {
      return row.clubID;
    }

    const normalizedClubName = this.normalizeClubName(row.clubName);
    if (normalizedClubName) {
      const matchedClub = this.clubContext.clubs.find(
        (club) => this.normalizeClubName(club.name) === normalizedClubName
      );
      if (matchedClub?.id) {
        return matchedClub.id;
      }
    }

    const match = /\b(\d{3,})\b/.exec(row.clubName);
    return match ? match[1] : '';
  }

  private normalizeClubName(value: string): string {
    return value.trim().replace(/\.+$/g, '').trim().toLowerCase();
  }

  private readCheckinsValue(payload: unknown, keys: string[], labelTokens: string[]): string {
    const rows = this.extractPayloadObjects(payload);

    for (const row of rows) {
      const direct = this.readDisplayValueCaseInsensitive(row, keys, '');
      if (direct) {
        return direct;
      }
    }

    for (const row of rows) {
      const label = this.readDisplayValueCaseInsensitive(
        row,
        ['MetricName', 'Label', 'Name', 'CheckInType', 'Type', 'Description'],
        ''
      ).toLowerCase();
      if (!labelTokens.every((token) => label.includes(token))) {
        continue;
      }

      const value = this.readDisplayValueCaseInsensitive(row, ['Value', 'Average', 'ThreeWeekAvg', 'CheckIns', 'Count'], '');
      if (value) {
        return value;
      }
    }

    if (rows.length >= 2) {
      const fallbackIndex = labelTokens.includes('sat') ? 1 : 0;
      const fallback = rows[fallbackIndex];
      if (fallback) {
        const value = this.readDisplayValueCaseInsensitive(
          fallback,
          ['Value', 'Average', 'ThreeWeekAvg', 'CheckIns', 'Count'],
          ''
        );
        if (value) {
          return value;
        }
      }
    }

    return 'N/A';
  }

  private extractPayloadObjects(payload: unknown): { [key: string]: unknown }[] {
    const rows: { [key: string]: unknown }[] = [];

    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          rows.push(item as { [key: string]: unknown });
        }
      }
      return rows;
    }

    if (!payload || typeof payload !== 'object') {
      return rows;
    }

    const root = payload as { [key: string]: unknown };
    rows.push(root);

    const wrappers = ['data', 'Data', 'result', 'Result', 'results', 'Results', 'items', 'Items', 'd'];
    for (const key of wrappers) {
      const nested = root[key];
      if (Array.isArray(nested)) {
        for (const item of nested) {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            rows.push(item as { [key: string]: unknown });
          }
        }
      } else if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        rows.push(nested as { [key: string]: unknown });
      }
    }

    return rows;
  }

  private readDisplayValueCaseInsensitive(
    row: { [key: string]: unknown },
    keys: string[],
    fallback: string
  ): string {
    const lowered = new Map<string, unknown>();
    for (const key of Object.keys(row)) {
      lowered.set(key.toLowerCase(), row[key]);
    }

    for (const key of keys) {
      const raw = lowered.get(key.toLowerCase());
      if (typeof raw === 'string') {
        const value = raw.trim();
        if (value.length > 0) {
          return value;
        }
      }

      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return `${raw}`;
      }
    }

    return fallback;
  }

  private readFirstNote(payload: unknown): string {
    const rows = this.extractPayloadObjects(payload);

    for (const row of rows) {
      const note = this.readDisplayValueCaseInsensitive(
        row,
        [
          'RequesterNote',
          'RequestorNote',
          'LineItemNote',
          'ApproverNote',
          'Note',
          'Notes',
          'Comments',
          'Comment',
          'RequesterComments',
          'RequestorComments'
        ],
        ''
      );
      if (note) {
        return note;
      }
    }

    return '';
  }

  private resolveEarliestNoteFromItemHist(payload: unknown): string {
    const rows = this.extractPayloadObjects(payload);
    if (rows.length === 0) {
      return '';
    }

    let earliestTime = Number.POSITIVE_INFINITY;
    let earliestNote = '';

    for (const row of rows) {
      const note = this.readDisplayValueCaseInsensitive(
        row,
        ['LineItemNote', 'RequesterNote', 'RequestorNote', 'Note', 'Notes', 'lineItemNote', 'note'],
        ''
      );
      if (!note) {
        continue;
      }

      const createdDateRaw = this.readDisplayValueCaseInsensitive(
        row,
        ['CreatedDate', 'createdDate', 'Date', 'date'],
        ''
      );
      const createdTime = this.parseDateToEpochMs(createdDateRaw);

      if (createdTime < earliestTime) {
        earliestTime = createdTime;
        earliestNote = note;
      }
    }

    return earliestNote;
  }

  private parseDateToEpochMs(raw: string): number {
    if (!raw) {
      return Number.POSITIVE_INFINITY;
    }

    const legacyMatch = /\/Date\((\d+)\)\//.exec(raw);
    if (legacyMatch) {
      const parsedMs = Number(legacyMatch[1]);
      return Number.isFinite(parsedMs) ? parsedMs : Number.POSITIVE_INFINITY;
    }

    const parsed = new Date(raw).getTime();
    if (Number.isNaN(parsed)) {
      return Number.POSITIVE_INFINITY;
    }

    return parsed;
  }

  private mapNoteHistory(payload: unknown): ModalNoteHistoryRow[] {
    const rows = this.extractPayloadObjects(payload);
    if (rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      date: this.formatDateValue(
        this.readDisplayValueCaseInsensitive(row, ['CreatedDate', 'Date', 'createdDate', 'date'], '')
      ),
      createdBy: this.readDisplayValueCaseInsensitive(row, ['CreatedBy', 'User', 'createdBy', 'user'], 'N/A'),
      note: this.readDisplayValueCaseInsensitive(
        row,
        ['LineItemNote', 'RequesterNote', 'RequestorNote', 'Note', 'Notes', 'lineItemNote', 'note'],
        'N/A'
      )
    }));
  }

  private mapOrderHistory(payload: unknown): ModalItemHistoryRow[] {
    const rows = this.extractPayloadObjects(payload);
    if (rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      orderDate: this.formatDateValue(this.readDisplayValueCaseInsensitive(row, ['PODATE', 'poDate'], '')),
      receivedDate: this.formatDateValue(this.readDisplayValueCaseInsensitive(row, ['RECEIVEDDATE', 'receivedDate'], '')),
      qtyOrdered: this.readDisplayValueCaseInsensitive(row, ['QTY_ORDERED', 'OTY_ORDERED', 'qtyOrdered'], 'N/A'),
      qtyReceived: this.readDisplayValueCaseInsensitive(row, ['QTY_RECEIVED', 'qtyReceived'], 'N/A'),
      status: this.mapOrderHistoryStatus(row)
    }));
  }

  private mapOrderHistoryStatus(row: { [key: string]: unknown }): string {
    const rawAction = this.readDisplayValueCaseInsensitive(row, ['ACTION', 'Action', 'action'], '');
    if (rawAction) {
      const parsed = Number(rawAction);
      if (Number.isFinite(parsed) && parsed === 2) {
        return 'Action';
      }
    }

    return 'N/A';
  }

  private formatDateValue(raw: string): string {
    if (!raw) {
      return 'N/A';
    }

    const legacyMatch = /\/Date\((\d+)\)\//.exec(raw);
    if (legacyMatch) {
      const parsedMs = Number(legacyMatch[1]);
      if (Number.isFinite(parsedMs)) {
        const date = new Date(parsedMs);
        if (!Number.isNaN(date.getTime())) {
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }
      }
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
  }
}
