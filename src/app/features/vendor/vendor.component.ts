import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ClubService, ClubVendor } from '../../shared/services/club.service';
import { ClubContextService } from '../../shared/services/club-context.service';

interface VendorLocation {
  clubName: string;
  count: number;
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
export class VendorComponent implements OnInit {
  isLoading = false;
  vendors: VendorAccordion[] = [];

  constructor(
    private readonly clubService: ClubService,
    private readonly clubContext: ClubContextService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  toggleVendor(index: number): void {
    this.vendors[index].expanded = !this.vendors[index].expanded;
  }

  onClubLinkClick(event: Event, clubName: string): void {
    event.preventDefault();
    this.clubContext.selectClubByName(clubName);
    this.router.navigate(['/order-list']);
  }

  private loadVendors(): void {
    this.isLoading = true;
    this.clubService
      .queryAllClubsVendors()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (rows) => {
          this.vendors = this.mapToVendorAccordions(rows);
        },
        error: () => {
          this.vendors = [];
        }
      });
  }

  private mapToVendorAccordions(rows: ClubVendor[] | null | undefined): VendorAccordion[] {
    if (!rows || rows.length === 0) {
      return [];
    }

    const grouped = new Map<string, ClubVendor[]>();

    for (const row of rows) {
      const vendorName =
        this.readString(row, ['OperationsDistrictVP', 'operationsDistrictVP']) || 'Unknown Vendor';
      const current = grouped.get(vendorName) ?? [];
      current.push(row);
      grouped.set(vendorName, current);
    }

    return Array.from(grouped.entries())
      .map(([name, groupRows]) => ({
        name,
        count: this.getUniqueClubCount(groupRows),
        expanded: false,
        locations: this.mapLocations(groupRows)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getUniqueClubCount(rows: ClubVendor[]): number {
    const uniqueClubs = new Set<string>();

    for (const row of rows) {
      const clubId = this.readString(row, ['ClubID', 'clubID', 'ClubId', 'clubId']);
      const location = this.readString(row, ['Location', 'location', 'ClubName', 'clubName']);
      const clubKey = clubId || location;

      if (clubKey) {
        uniqueClubs.add(clubKey);
      }
    }

    return uniqueClubs.size;
  }

  private mapLocations(rows: ClubVendor[]): VendorLocation[] {
    const locationCounts = new Map<string, number>();

    for (const row of rows) {
      const locationRaw =
        this.readString(row, ['Location', 'location', 'ClubName', 'clubName']) || 'Unknown Location';
      const location = this.normalizeClubName(locationRaw);
      locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
    }

    return Array.from(locationCounts.entries())
      .map(([location, count]) => ({
        clubName: location,
        count
      }))
      .sort((a, b) => a.clubName.localeCompare(b.clubName));
  }

  private normalizeClubName(value: string): string {
    return value
      .trim()
      .replace(/\.+$/g, '')
      .replace(/\s*\(\d+\)\s*$/g, '')
      .replace(/\.+$/g, '')
      .trim();
  }

  private readString(row: ClubVendor, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return '';
  }
}
