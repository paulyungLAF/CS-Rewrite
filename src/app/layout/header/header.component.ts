import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ClubContextService } from '../../shared/services/club-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(public clubContext: ClubContextService) {}

  onClubChange(event: Event): void {
    this.clubContext.setSelectedClub((event.target as HTMLSelectElement).value);
  }
}
