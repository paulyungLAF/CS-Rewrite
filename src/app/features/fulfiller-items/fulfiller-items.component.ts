import { Component } from '@angular/core';

type DomRowStyle = 'row-action' | 'row-warn' | 'row-complete' | '';

interface DomItemRow {
  buyer: string;
  clubName: string;
  itemNumber: string;
  itemDesc: string;
  qty: number;
  total: string;
  requested: string;
  status: string;
  style: DomRowStyle;
}

interface DomGroup {
  name: string;
  count: number;
  expanded: boolean;
  rows: DomItemRow[];
}

const BASE_ROWS: DomItemRow[] = [
  {
    buyer: 'CS',
    clubName: 'ARLINGTON - US 287',
    itemNumber: '5001',
    itemDesc: 'CLOCK - HOWARD MILLER WALLMT - CHROME COATED PLASTIC',
    qty: 1,
    total: '$35.000',
    requested: '11/16/2022',
    status: 'Responded',
    style: 'row-action'
  },
  {
    buyer: 'CS',
    clubName: 'ARLINGTON - US 287',
    itemNumber: 'BDS10065ABCM',
    itemDesc: '11/16/2022 1:09 PM',
    qty: 1,
    total: '$45.00',
    requested: '11/16/2022',
    status: 'New',
    style: 'row-warn'
  },
  {
    buyer: 'CS',
    clubName: 'ARLINGTON - US 287',
    itemNumber: '1301601-CS',
    itemDesc: '1/30/2022 8:00 AM',
    qty: 1,
    total: '$35.00',
    requested: '11/16/2022',
    status: 'New',
    style: 'row-complete'
  },
  {
    buyer: 'CS',
    clubName: 'ARLINGTON - US 287',
    itemNumber: 'BDS10065ABCM',
    itemDesc: 'KIDS KLUB ITEM',
    qty: 1,
    total: '$45.00',
    requested: '11/16/2022',
    status: 'Action',
    style: ''
  }
];

@Component({
  selector: 'app-fulfiller-items',
  standalone: true,
  templateUrl: './fulfiller-items.component.html',
  styleUrls: ['./fulfiller-items.component.scss']
})
export class FulfillerItemsComponent {
  groups: DomGroup[] = [
    { name: 'ABINGTON', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'ABINGTON', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'ALIANA', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'ALLENTOWN', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'ASPEL HILL', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'BAY SHORE - AUSTELL RD', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'BOWIE', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'BRONX', count: 1, expanded: false, rows: BASE_ROWS },
    { name: 'BRONX', count: 1, expanded: false, rows: BASE_ROWS }
  ];

  toggleGroup(index: number): void {
    this.groups[index].expanded = !this.groups[index].expanded;
  }
}
