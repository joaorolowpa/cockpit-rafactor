import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FundNoteFileType } from '../../../../models/funds.model';

@Component({
  selector: 'app-funds-note-type-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule],
  templateUrl: './funds-note-type-dialog.component.html',
  styleUrl: './funds-note-type-dialog.component.scss'
})
export class FundsNoteTypeDialogComponent {
  private readonly fb = inject(FormBuilder);

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Omit<FundNoteFileType, 'id' | 'created_at'>>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    display_name: ['', Validators.required],
    name: [''],
    description: ['']
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const displayName = (raw.display_name ?? '').trim();
    const nameValue = (raw.name ?? '').trim() || this.slugify(displayName);
    const descriptionValue = (raw.description ?? '').trim();
    const payload: Omit<FundNoteFileType, 'id' | 'created_at'> = {
      name: nameValue,
      display_name: displayName,
      description: descriptionValue ? descriptionValue : null
    };

    this.isSubmitting.set(false);
    this.created.emit(payload);
  }

  protected onClose(): void {
    this.close.emit();
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'fund_note_type';
  }
}
