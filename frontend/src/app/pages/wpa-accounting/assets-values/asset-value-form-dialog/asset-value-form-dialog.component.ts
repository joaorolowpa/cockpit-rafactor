import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

import { CreateAssetValuePayload, WpaAccountingService, WpaAsset } from '../../wpa-accounting.service';
import { UI_IMPORTS } from '../../../../ui/ui.imports';

@Component({
  selector: 'app-asset-value-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ...UI_IMPORTS],
  templateUrl: './asset-value-form-dialog.component.html',
  styleUrl: './asset-value-form-dialog.component.scss'
})
export class AssetValueFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly wpaService = inject(WpaAccountingService);

  @Input() assets: WpaAsset[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    asset_id: [null as number | null, Validators.required],
    total_value_in_brl: [null as number | null, Validators.required],
    wpa_value_in_brl: [null as number | null, Validators.required],
    date_reference: ['', Validators.required],
    comment: ['']
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const payload: CreateAssetValuePayload = {
      asset_id: Number(raw.asset_id),
      total_value_in_brl: raw.total_value_in_brl !== null ? Number(raw.total_value_in_brl) : null,
      wpa_value_in_brl: raw.wpa_value_in_brl !== null ? Number(raw.wpa_value_in_brl) : null,
      date_reference: raw.date_reference ? String(raw.date_reference) : null,
      comment: raw.comment?.trim() || null
    };

    this.wpaService.createAssetValue(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => {
        console.error('Error creating asset value:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected trackByAssetId(_index: number, asset: WpaAsset): number {
    return asset.asset_id;
  }
}
