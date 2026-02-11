import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notes-types-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes-types-footer.component.html',
  styleUrl: './notes-types-footer.component.scss'
})
export class NotesTypesFooterComponent {
  filteredCount = input.required<number>();
  totalCount = input.required<number>();
}
