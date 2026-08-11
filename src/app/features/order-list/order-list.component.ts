import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ClubContextService } from '../../shared/services/club-context.service';

type RowTone = 'tone-action' | 'tone-pending' | 'tone-receiving' | '';

interface OrderRow {
  photo: string;
  itemDescription: string;
  quantity: number;
  qtyReceived: number;
  requestDate: string;
  orderedDate: string;
  dateReceived: string;
  status: 'Action' | 'Receive' | 'Complete' | 'New';
  tone: RowTone;
}

interface ClubOrders {
  club: string;
  rows: OrderRow[];
}

const BASE_ROWS: OrderRow[] = [
  { photo: 'RO', itemDescription: 'ROPE', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Action', tone: 'tone-action' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Receive', tone: 'tone-pending' },
  { photo: 'PS', itemDescription: 'PULL STRING', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: 'tone-receiving' },
  { photo: 'PS', itemDescription: 'PULL STRING', quantity: 4, qtyReceived: 4, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'New', tone: '' },
  { photo: 'PS', itemDescription: 'PULL STRING', quantity: 2, qtyReceived: 2, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'New', tone: '' },
  { photo: 'RC', itemDescription: 'RECEIVER', quantity: 3, qtyReceived: 3, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'New', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' },
  { photo: 'PT', itemDescription: 'PT BOOK', quantity: 1, qtyReceived: 1, requestDate: '11/16/2022', orderedDate: '11/16/2022', dateReceived: '11/16/2022', status: 'Complete', tone: '' }
];

@Component({
  selector: 'app-order-list',
  standalone: true,
  templateUrl: './order-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent {
  isExecutive = true;
  searchText = '';
  activeInventoryTab: 'order' | 'cooler' | 'retail' = 'order';

  clubOrders: ClubOrders[] = [
    { club: 'Cranston', rows: BASE_ROWS },
    { club: 'Arlington - US 287', rows: BASE_ROWS },
    { club: 'Abington', rows: BASE_ROWS },
    { club: 'Alianna', rows: BASE_ROWS }
  ];

  get visibleRows(): OrderRow[] {
    const rows = this.clubOrders.find((c) => c.club === this.clubContext.selectedClub)?.rows ?? [];
    const term = this.searchText.trim().toLowerCase();
    return term ? rows.filter((r) => r.itemDescription.toLowerCase().includes(term)) : rows;
  }

  constructor(public clubContext: ClubContextService) {
    if (!this.clubContext.clubs.includes(this.clubContext.selectedClub)) {
      this.clubContext.setSelectedClub(this.clubContext.clubs[0]);
    }
  }
}
