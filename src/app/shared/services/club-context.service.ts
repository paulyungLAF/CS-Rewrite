import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Club, ClubService } from './club.service';

export interface ClubOption {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubContextService {
  clubs: ClubOption[] = [];
  selectedClubId = '';
  private readonly selectedClubIdSubject = new BehaviorSubject<string>('');
  readonly selectedClubId$ = this.selectedClubIdSubject.asObservable();

  constructor(private readonly clubService: ClubService) {}

  loadClubs(): void {
    this.clubService.queryClubDropdown().subscribe({
      next: (rows) => {
        const clubs = this.mapClubOptions(rows);
        if (clubs.length === 0) {
          return;
        }

        this.clubs = clubs;
        const stillValid = clubs.some((club) => club.id === this.selectedClubId);
        if (!this.selectedClubId || !stillValid) {
          this.setSelectedClub(clubs[0].id);
        }
      },
      error: () => {
        this.clubs = [];
        this.setSelectedClub('');
      }
    });
  }

  setSelectedClub(clubId: string): void {
    this.selectedClubId = clubId;
    this.selectedClubIdSubject.next(clubId);
  }

  selectClubByName(clubName: string): void {
    const target = this.normalizeClubName(clubName);
    if (!target) {
      return;
    }

    const fromLoaded = this.clubs.find((club) => this.normalizeClubName(club.name) === target);
    if (fromLoaded) {
      this.setSelectedClub(fromLoaded.id);
      return;
    }

    this.clubService.queryClubDropdown().subscribe({
      next: (rows) => {
        const clubs = this.mapClubOptions(rows);
        this.clubs = clubs;

        const match = clubs.find((club) => this.normalizeClubName(club.name) === target);
        if (match) {
          this.setSelectedClub(match.id);
        }
      }
    });
  }

  private normalizeClubName(value: string): string {
    return value.trim().replace(/\.+$/g, '').trim().toLowerCase();
  }

  get selectedClubName(): string {
    return this.clubs.find((club) => club.id === this.selectedClubId)?.name ?? '';
  }

  private mapClubOptions(rows: Club[] | null | undefined): ClubOption[] {
    if (!rows || rows.length === 0) {
      return [];
    }

    const byId = new Map<string, ClubOption>();
    for (const row of rows) {
      const club = this.readClubOption(row);
      if (club) {
        byId.set(club.id, club);
      }
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private readClubOption(row: Club): ClubOption | null {
    const nameValue = row['ClubName'] ?? row['clubName'];
    const idValue = row['ClubID'] ?? row['clubID'] ?? row['ClubId'] ?? row['clubId'];

    const name = typeof nameValue === 'string' ? nameValue.trim() : '';
    const id = idValue == null ? '' : String(idValue).trim();

    if (!name || !id) {
      return null;
    }

    return { id, name };
  }
}
