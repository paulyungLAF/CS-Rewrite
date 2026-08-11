import { Component } from '@angular/core';
import { ClubContextService } from '../../shared/services/club-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(public clubContext: ClubContextService) {}

  onClubChange(event: Event): void {
    this.clubContext.setSelectedClub((event.target as HTMLSelectElement).value);
  }
}
