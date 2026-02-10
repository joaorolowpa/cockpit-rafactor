import { Component, effect, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FundManagerContent, FundManagerDetails } from '../../../../../models/funds.model';
import { FundsService } from '../../../funds.service';
import { RichTextEditorComponent } from './rich-text-editor/rich-text-editor.component';
import { UI_IMPORTS } from '../../../../../ui/ui.imports';

@Component({
  selector: 'app-fund-manager-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, RichTextEditorComponent, ...UI_IMPORTS],
  templateUrl: './fund-manager-edit-dialog.component.html',
  styleUrl: './fund-manager-edit-dialog.component.scss'
})
export class FundManagerEditDialogComponent {
  private readonly fundsService = inject(FundsService);

  fundManagerId = input.required<number>();
  content = input<FundManagerContent | null>(null);

  close = output<void>();
  updated = output<FundManagerDetails>();

  protected isSubmitting = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);

  protected form = signal<FundManagerContent>({
    website: '',
    firm_aum: '',
    firm_about: '',
    firm_strategies: '',
    contact_information: ''
  });

  constructor() {
    effect(() => {
      const content = this.content();
      this.form.set({
        website: content?.website ?? '',
        firm_aum: content?.firm_aum ?? '',
        firm_about: content?.firm_about ?? '',
        firm_strategies: content?.firm_strategies ?? '',
        contact_information: content?.contact_information ?? ''
      });
      this.errorMessage.set(null);
    });
  }

  protected updateField<K extends keyof FundManagerContent>(key: K, value: FundManagerContent[K]): void {
    this.form.set({
      ...this.form(),
      [key]: value
    });
  }

  protected onSubmit(): void {
    if (this.isSubmitting()) return;

    const website = this.normalizeText(this.form().website);
    if (website && !this.isValidUrl(website)) {
      this.errorMessage.set('Website must be a valid URL.');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload: FundManagerContent = {
      website,
      firm_aum: this.normalizeText(this.form().firm_aum),
      firm_about: this.normalizeText(this.form().firm_about),
      firm_strategies: this.normalizeText(this.form().firm_strategies),
      contact_information: this.normalizeText(this.form().contact_information)
    };

    this.fundsService.updateFundManagerDetails(this.fundManagerId(), payload).subscribe({
      next: (details) => {
        this.isSubmitting.set(false);
        this.updated.emit(details);
      },
      error: (error) => {
        console.error('Error updating fund manager details:', error);
        this.errorMessage.set('Failed to update fund manager. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  private normalizeText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}
