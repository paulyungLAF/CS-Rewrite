import { Component } from '@angular/core';
import { CloseItemsApiService } from '../../shared/services/close-items-api.service';

interface CloseItemRow {
  pic: string;
  buyer: string;
  itemDesc: string;
  itemNumber: string;
  clubId: string;
  quantity: number;
  qtyReceived: number;
  requested: string;
  ordered: string;
  received: string;
  poNumber: string;
  closing?: boolean;
}

interface CloseClubAccordion {
  club: string;
  count: number;
  expanded: boolean;
  rows: CloseItemRow[];
}

const SAMPLE_ROWS: CloseItemRow[] = [
  {
    pic: 'PIC',
    buyer: 'CS',
    itemDesc: 'CLOCK - HOWARD MILLER WALLMT - CHROME COATED PLASTIC',
    itemNumber: '5001',
    clubId: 'ABINGTON',
    quantity: 1,
    qtyReceived: 1,
    requested: '11/16/2022',
    ordered: '11/16/2022',
    received: '11/16/2022',
    poNumber: 'PO-19428'
  },
  {
    pic: 'PIC',
    buyer: 'CS',
    itemDesc: 'PT BOOK',
    itemNumber: 'PT-2002',
    clubId: 'ABINGTON',
    quantity: 2,
    qtyReceived: 2,
    requested: '11/16/2022',
    ordered: '11/16/2022',
    received: '11/16/2022',
    poNumber: 'PO-19457'
  }
];

@Component({
  selector: 'app-close-items',
  standalone: true,
  templateUrl: './close-items.component.html',
  styleUrls: ['./close-items.component.scss']
})
export class CloseItemsComponent {
  clubs: CloseClubAccordion[] = [
    { club: 'ABINGTON', count: 2, expanded: true, rows: SAMPLE_ROWS },
    { club: 'ALIANA', count: 1, expanded: false, rows: SAMPLE_ROWS.slice(0, 1) },
    { club: 'ALLENTOWN', count: 1, expanded: false, rows: SAMPLE_ROWS.slice(0, 1) },
    { club: 'ASPEL HILL', count: 1, expanded: false, rows: SAMPLE_ROWS.slice(0, 1) },
    { club: 'BAY SHORE - AUSTELL RD', count: 1, expanded: false, rows: SAMPLE_ROWS.slice(0, 1) },
    { club: 'BOWIE', count: 1, expanded: false, rows: SAMPLE_ROWS.slice(0, 1) }
  ];

  constructor(private readonly closeItemsApi: CloseItemsApiService) {}

  toggleClub(index: number): void {
    this.clubs[index].expanded = !this.clubs[index].expanded;
  }

  closeItem(row: CloseItemRow): void {
    if (row.closing) {
      return;
    }

    row.closing = true;
    this.closeItemsApi
      .closeItem({
        itemNumber: row.itemNumber,
        clubId: row.clubId,
        buyer: row.buyer
      })
      .subscribe({
        next: () => {
          row.closing = false;
        },
        error: (error: unknown) => {
          row.closing = false;
          console.error('Failed to close item', error);
        }
      });
  }
}
