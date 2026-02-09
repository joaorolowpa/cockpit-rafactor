import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

import { CreateAssetPayload, WpaAccountingService } from '../../wpa-accounting.service';

@Component({
  selector: 'app-asset-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule],
  templateUrl: './asset-form-dialog.component.html',
  styleUrl: './asset-form-dialog.component.scss'
})
export class AssetFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly wpaService = inject(WpaAccountingService);

  @Input() assetTypes: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.group({
    asset_name: ['', Validators.required],
    asset_type_description: ['', Validators.required],
    asset_description: ['']
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const payload: CreateAssetPayload = {
      asset_name: raw.asset_name?.trim() ?? '',
      asset_type_description: raw.asset_type_description?.trim() ?? '',
      asset_description: raw.asset_description?.trim() || null
    };

    this.wpaService.createAsset(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (error: unknown) => {
        console.error('Error creating asset:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
