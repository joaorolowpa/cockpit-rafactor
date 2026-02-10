import { Component, EventEmitter, Input, Output, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CompaniesService } from '../../companies.service';
import { Company } from '../../../../models/companies.model';
import { UI_IMPORTS } from '../../../../ui/ui.imports';

@Component({
  selector: 'app-company-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ...UI_IMPORTS],
  templateUrl: './company-form-dialog.component.html',
  styleUrl: './company-form-dialog.component.scss'
})
export class CompanyFormDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly companiesService = inject(CompaniesService);

  @Input() company: Company | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    display_name: ['', Validators.required],
    capital_iq_id: [null as number | null, Validators.required]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['company']) {
      if (this.company) {
        this.form.patchValue({
          display_name: this.company.display_name,
          capital_iq_id: this.company.capital_iq_id
        });
      } else {
        this.form.reset({ display_name: '', capital_iq_id: null });
      }
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const payload = {
      display_name: raw.display_name?.trim() ?? '',
      capital_iq_id: Number(raw.capital_iq_id)
    };

    const request$ = this.company
      ? this.companiesService.updateCompany(this.company.id, payload)
      : this.companiesService.createCompany(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error) => {
        console.error('Error saving company:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
