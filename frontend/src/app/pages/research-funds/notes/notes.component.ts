import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FundNoteFileType } from '../../../models/funds.model';
import { FundsNoteTypeDialogComponent } from './funds-note-type-dialog/funds-note-type-dialog.component';
import { NotesTypesTableComponent } from './notes-types-table/notes-types-table.component';
import { NotesTypesFooterComponent } from './notes-types-footer/notes-types-footer.component';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule,
    FundsNoteTypeDialogComponent,
    NotesTypesTableComponent,
    NotesTypesFooterComponent,
    ...UI_IMPORTS
  ],
  templateUrl: './notes.component.html'
})
export class NotesComponent implements OnInit {
  types = signal<FundNoteFileType[]>([]);
  filteredTypes = signal<FundNoteFileType[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  showDialog = signal<boolean>(false);
  confirmTarget = signal<FundNoteFileType | null>(null);
  readonly isDeletableFn = (item: FundNoteFileType): boolean => this.isDeletable(item);
  readonly formatCreatedAtFn = (value: string): string => this.formatCreatedAt(value);

  constructor() {}

  ngOnInit(): void {
    this.loadTypes();
  }

  loadTypes(): void {
    this.loading.set(true);
    this.error.set(null);
    const types = this.getMockTypes();
    this.types.set(types);
    this.filteredTypes.set([...types]);
    this.loading.set(false);
  }

  onSearch(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredTypes.set([...this.types()]);
      return;
    }

    this.filteredTypes.set(
      this.types().filter(item =>
        (item.display_name ?? '').toLowerCase().includes(term) ||
        (item.name ?? '').toLowerCase().includes(term)
      )
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.filteredTypes.set([...this.types()]);
  }

  openDialog(): void {
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }

  onTypeCreated(payload: Omit<FundNoteFileType, 'id' | 'created_at'>): void {
    const current = this.types();
    const nextId = current.length ? Math.max(...current.map(item => item.id)) + 1 : 1;
    const newType: FundNoteFileType = {
      id: nextId,
      created_at: new Date().toISOString(),
      ...payload
    };

    this.types.set([newType, ...current]);
    this.onSearch();
    this.closeDialog();
  }

  requestDeleteType(item: FundNoteFileType): void {
    if (!this.isDeletable(item)) return;
    this.confirmTarget.set(item);
  }

  confirmDeleteType(): void {
    const item = this.confirmTarget();
    if (!item) return;
    this.confirmTarget.set(null);
    const next = this.types().filter(type => type.id !== item.id);
    this.types.set(next);
    this.onSearch();
  }

  cancelDeleteType(): void {
    this.confirmTarget.set(null);
  }

  isDeletable(item: FundNoteFileType): boolean {
    if (!item.created_at) return false;
    const createdAt = new Date(item.created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }

  formatCreatedAt(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'MMM d, y', 'en-US');
  }

  private getMockTypes(): FundNoteFileType[] {
    return [
      {
        id: 1,
        name: 'fund_summary_2025',
        display_name: 'Fund Summary 2025',
        description: 'Summary document for fund performance in 2025.',
        created_at: '2025-01-01T10:15:30Z'
      },
      {
        id: 2,
        name: 'market_analysis_2024',
        display_name: 'Market Analysis 2024',
        description: 'Detailed market analysis and trends for 2024.',
        created_at: '2024-12-15T14:00:00Z'
      },
      {
        id: 3,
        name: 'investment_plan_q1',
        display_name: 'Investment Plan Q1',
        description: null,
        created_at: '2025-01-05T09:45:00Z'
      },
      {
        id: 4,
        name: 'annual_report',
        display_name: 'Annual Report',
        description: 'Comprehensive report covering the year 2024.',
        created_at: '2024-11-20T16:30:00Z'
      },
      {
        id: 5,
        name: 'risk_assessment_doc',
        display_name: 'Risk Assessment Document',
        description: 'Assessment of risk factors for portfolio investments.',
        created_at: '2025-01-10T12:00:00Z'
      }
    ];
  }
}
