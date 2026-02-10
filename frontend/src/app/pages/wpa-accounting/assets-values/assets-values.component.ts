import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { WpaAccountingService, WpaAsset, WpaAssetValue } from '../wpa-accounting.service';
import { AssetValueFormDialogComponent } from './asset-value-form-dialog/asset-value-form-dialog.component';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-assets-values',
  standalone: true,
  imports: [CommonModule, AssetValueFormDialogComponent, ...UI_IMPORTS],
  templateUrl: './assets-values.component.html',
  styleUrl: './assets-values.component.scss'
})
export class AssetsValuesComponent implements OnInit {
  private readonly wpaService = inject(WpaAccountingService);
  private readonly destroyRef = inject(DestroyRef);

  protected assetValues = signal<WpaAssetValue[]>([]);
  protected availableAssets = signal<WpaAsset[]>([]);
  protected searchTerm = signal<string>('');
  protected selectedAssetType = signal<string>('');
  protected selectedAssetName = signal<string>('');
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);
  protected showDialog = signal<boolean>(false);
  protected confirmTarget = signal<WpaAssetValue | null>(null);

  protected readonly assetTypeOptions = computed(() => {
    const types = this.assetValues()
      .map((item) => item.asset_type_name?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly assetNameOptions = computed(() => {
    const names = this.assetValues()
      .map((item) => item.asset_name?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly filteredAssetValues = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const selectedType = this.selectedAssetType().trim().toLowerCase();
    const selectedName = this.selectedAssetName().trim().toLowerCase();

    return this.assetValues().filter((item) => {
      const name = (item.asset_name ?? '').toLowerCase();
      const type = (item.asset_type_name ?? '').toLowerCase();
      const matchesTerm = !term || name.includes(term);
      const matchesType = !selectedType || type === selectedType;
      const matchesName = !selectedName || name === selectedName;
      return matchesTerm && matchesType && matchesName;
    });
  });

  ngOnInit(): void {
    this.loadAssetValues();
  }

  protected loadAssetValues(): void {
    this.loading.set(true);
    this.error.set(null);
    let hadError = false;

    forkJoin({
      values: this.wpaService.getAssetsValues().pipe(
        catchError((err) => {
          console.error('Failed to load asset values', err);
          hadError = true;
          return of([] as WpaAssetValue[]);
        })
      ),
      assets: this.wpaService.getAssets().pipe(
        catchError((err) => {
          console.error('Failed to load assets list', err);
          return of([] as WpaAsset[]);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ values, assets }) => {
          this.assetValues.set(values ?? []);
          this.availableAssets.set(assets ?? []);
          if (hadError && values.length === 0) {
            this.error.set('Failed to load asset values.');
          }
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load asset values', err);
          this.error.set('Failed to load asset values.');
          this.loading.set(false);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedAssetType.set('');
    this.selectedAssetName.set('');
  }

  protected openCreateDialog(): void {
    this.showDialog.set(true);
  }

  protected closeDialog(): void {
    this.showDialog.set(false);
  }

  protected onAssetValueSaved(): void {
    this.closeDialog();
    this.loadAssetValues();
  }

  protected requestDeleteAssetValue(assetValue: WpaAssetValue): void {
    if (!this.isDeletable(assetValue)) return;
    if (!assetValue.asset_value_id) return;
    this.confirmTarget.set(assetValue);
  }

  protected confirmDeleteAssetValue(): void {
    const assetValue = this.confirmTarget();
    if (!assetValue?.asset_value_id) return;
    this.confirmTarget.set(null);

    this.wpaService
      .deleteAssetValue(assetValue.asset_value_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadAssetValues(),
        error: (error: unknown) => {
          console.error('Failed to delete asset value:', error);
        }
      });
  }

  protected cancelDeleteAssetValue(): void {
    this.confirmTarget.set(null);
  }

  protected isDeletable(assetValue: WpaAssetValue): boolean {
    if (!assetValue.value_created_at) return false;
    const createdAt = new Date(assetValue.value_created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }

  protected formatBrlValue(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    const formattedValue = Math.abs(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `R$ ${value < 0 ? '-' : ''}${formattedValue}`;
  }

  protected isNegative(value: number | null | undefined): boolean {
    return value !== null && value !== undefined && value < 0;
  }

  protected isPositive(value: number | null | undefined): boolean {
    return value !== null && value !== undefined && value >= 0;
  }

  protected formatDateReference(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'dd/MM/yyyy', 'en-US');
  }

  protected formatCreatedAt(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'MMM d, y, HH:mm', 'en-US');
  }

  protected formatCreatedBy(assetValue: WpaAssetValue): string {
    return assetValue.asset_value_created_by_name || assetValue.asset_value_created_by_email || '-';
  }

  protected trackByAssetValueId(_index: number, item: WpaAssetValue): number {
    return item.asset_value_id;
  }
}
