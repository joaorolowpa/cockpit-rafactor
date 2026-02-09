import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

import {
  BackofficeQuotasWpaQuantityService,
  CreateQuotaAcquisitionPayload,
  WpaAssetWithQuota
} from '../quotas-wpa-quantity.service';

@Component({
  selector: 'app-quota-acquisition-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule],
  templateUrl: './quota-acquisition-form-dialog.component.html',
  styleUrl: './quota-acquisition-form-dialog.component.scss'
})
export class QuotaAcquisitionFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly quotasService = inject(BackofficeQuotasWpaQuantityService);

  @Input() assets: WpaAssetWithQuota[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  protected isSubmitting = signal<boolean>(false);
  protected submitError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    wpa_asset_id: [null as number | null, Validators.required],
    date_reference: ['', Validators.required],
    quantidade_cotas: [null as number | null, Validators.required],
    valor_cota: [null as number | null, Validators.required],
    comment: ['']
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateQuotaAcquisitionPayload = {
      wpa_asset_id: Number(raw.wpa_asset_id),
      date_reference: String(raw.date_reference),
      quantidade_cotas: Number(raw.quantidade_cotas ?? 0),
      valor_cota: Number(raw.valor_cota ?? 0),
      comment: raw.comment?.trim() ?? ''
    };

    this.quotasService.createQuotaAcquisition(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => {
        console.error('Error creating quota acquisition:', error);
        this.submitError.set('Failed to create quota acquisition. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected trackByAsset(_index: number, asset: WpaAssetWithQuota): number {
    return asset.id;
  }
}
