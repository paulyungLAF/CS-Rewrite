import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClubContextService {
  readonly clubs = ['Cranston', 'Arlington - US 287', 'Abington', 'Alianna'];
  selectedClub = this.clubs[0];

  setSelectedClub(club: string): void {
    this.selectedClub = club;
  }
}
