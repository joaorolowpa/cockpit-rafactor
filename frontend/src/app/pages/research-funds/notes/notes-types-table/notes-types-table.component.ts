import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundNoteFileType } from '../../../../models/funds.model';
import { UI_IMPORTS } from '../../../../ui/ui.imports';

@Component({
  selector: 'app-notes-types-table',
  standalone: true,
  imports: [CommonModule, ...UI_IMPORTS],
  templateUrl: './notes-types-table.component.html',
  styleUrl: './notes-types-table.component.scss'
})
export class NotesTypesTableComponent {
  types = input.required<FundNoteFileType[]>();
  filteredTypes = input.required<FundNoteFileType[]>();
  isDeletable = input.required<(item: FundNoteFileType) => boolean>();
  formatCreatedAt = input.required<(value: string) => string>();
  deleteRequested = output<FundNoteFileType>();

  trackById(_index: number, item: FundNoteFileType): number {
    return item.id;
  }

  requestDelete(item: FundNoteFileType): void {
    if (!this.isDeletable()(item)) return;
    this.deleteRequested.emit(item);
  }
}
