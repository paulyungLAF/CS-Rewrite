import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  // Placeholder values; replace with API-driven options when backend is connected.
  buyerIds = ['ALL', 'CS', 'KL', 'RM'];
  itemCategories = ['ALL', 'CLOCK', 'KIDS', 'OFFICE'];
  statuses = ['Rejected', 'New', 'Responded', 'Action'];
}
