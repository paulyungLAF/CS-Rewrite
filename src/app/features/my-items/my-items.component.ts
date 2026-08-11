import { Component, ChangeDetectionStrategy } from '@angular/core';

interface MyItemRow {
  photoText: string;
  buyer: string;
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

const SAMPLE_ROWS: MyItemRow[] = [
  {
    photoText: 'Product',
    buyer: 'CS',
    itemNumber: '5001',
    itemDesc: 'CLOCK - HOWARD MILLER WALLMT - CHROME COATED PLASTIC',
    qty: 1,
    requested: '11/16/2022',
    total: '$35.00',
    status: 'Action'
  }
];

@Component({
  selector: 'app-my-items',
  standalone: true,
  templateUrl: './my-items.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./my-items.component.scss']
})
export class MyItemsComponent {
  bulkApproval = false;

  clubs: ClubAccordion[] = [
    { club: '4S RANCH', count: 1, expanded: true, rows: SAMPLE_ROWS },
    { club: 'ABINGTON', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'ALIANA', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'ALLENTOWN', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'ASPEL HILL', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'BAY SHORE - AUSTELL RD', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'BOWIE', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'BRONX', count: 1, expanded: false, rows: SAMPLE_ROWS },
    { club: 'BRONX', count: 1, expanded: false, rows: SAMPLE_ROWS }
  ];

  toggleClub(index: number): void {
    this.clubs[index].expanded = !this.clubs[index].expanded;
  }
}
