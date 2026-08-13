import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ClubContextService } from '../../shared/services/club-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  constructor(public clubContext: ClubContextService) {}

  ngOnInit(): void {
    this.clubContext.loadClubs();
  }

  onClubChange(event: Event): void {
    this.clubContext.setSelectedClub((event.target as HTMLSelectElement).value);
  }
}
