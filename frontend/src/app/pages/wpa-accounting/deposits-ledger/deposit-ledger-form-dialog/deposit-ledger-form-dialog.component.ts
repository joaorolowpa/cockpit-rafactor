import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

import { CreateDepositLedgerPayload, WpaAccountingService, WpaAsset } from '../../wpa-accounting.service';
import { UI_IMPORTS } from '../../../../ui/ui.imports';

@Component({
  selector: 'app-deposit-ledger-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ...UI_IMPORTS],
  templateUrl: './deposit-ledger-form-dialog.component.html',
})
export class DepositLedgerFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly wpaService = inject(WpaAccountingService);

  @Input() assets: WpaAsset[] = [];
  @Input() depositTypes: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    asset_id: [null as number | null, Validators.required],
    deposit_type: ['', Validators.required],
    deposit_value_in_brl: [null as number | null, Validators.required],
    deposit_value_in_usd: [null as number | null],
    deposit_date_reference: ['', Validators.required]
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const payload: CreateDepositLedgerPayload = {
      asset_id: Number(raw.asset_id),
      deposit_type: raw.deposit_type?.trim() ?? '',
      deposit_value_in_brl: raw.deposit_value_in_brl !== null ? Number(raw.deposit_value_in_brl) : null,
      deposit_value_in_usd: raw.deposit_value_in_usd !== null ? Number(raw.deposit_value_in_usd) : null,
      deposit_date_reference: raw.deposit_date_reference ? String(raw.deposit_date_reference) : null
    };

    this.wpaService.createDepositLedger(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => {
        console.error('Error creating deposit ledger:', error);
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
