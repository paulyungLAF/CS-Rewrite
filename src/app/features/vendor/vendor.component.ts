import { Component, ChangeDetectionStrategy } from '@angular/core';

interface VendorLocation {
  label: string;
}

interface VendorAccordion {
  name: string;
  count: number;
  expanded: boolean;
  locations: VendorLocation[];
}

@Component({
  selector: 'app-vendor',
  standalone: true,
  templateUrl: './vendor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./vendor.component.scss']
})
export class VendorComponent {
  vendors: VendorAccordion[] = [
    {
      name: 'AMAZON',
      count: 2,
      expanded: true,
      locations: [{ label: 'ROUND ROCK - RURAL RD. 620 (1)' }, { label: 'YONKERS (1)' }]
    },
    { name: 'BIOSPACE', count: 2, expanded: false, locations: [{ label: 'HOUSTON (1)' }, { label: 'AUSTIN (1)' }] },
    { name: 'BIOSPACE', count: 2, expanded: false, locations: [{ label: 'HOUSTON (1)' }, { label: 'AUSTIN (1)' }] },
    { name: 'BIOSPACE', count: 2, expanded: false, locations: [{ label: 'HOUSTON (1)' }, { label: 'AUSTIN (1)' }] },
    { name: 'BALA BANGELES', count: 2, expanded: false, locations: [{ label: 'DALLAS (1)' }, { label: 'PLANO (1)' }] },
    { name: 'BALA BANGELES', count: 2, expanded: false, locations: [{ label: 'DALLAS (1)' }, { label: 'PLANO (1)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] },
    { name: 'BUYMATS INC', count: 45, expanded: false, locations: [{ label: 'DENVER (22)' }, { label: 'PHOENIX (23)' }] }
  ];

  toggleVendor(index: number): void {
    this.vendors[index].expanded = !this.vendors[index].expanded;
  }
}
