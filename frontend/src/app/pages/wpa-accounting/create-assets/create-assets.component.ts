import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputTextModule } from 'primeng/inputtext';

import { WpaAccountingService, WpaAsset } from '../wpa-accounting.service';
import { AssetFormDialogComponent } from './asset-form-dialog/asset-form-dialog.component';

@Component({
  selector: 'app-create-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, AssetFormDialogComponent],
  templateUrl: './create-assets.component.html',
  styleUrl: './create-assets.component.scss'
})
export class CreateAssetsComponent implements OnInit {
  private readonly wpaService = inject(WpaAccountingService);
  private readonly destroyRef = inject(DestroyRef);

  protected assets = signal<WpaAsset[]>([]);
  protected searchTerm = signal<string>('');
  protected selectedAssetType = signal<string>('');
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);
  protected showDialog = signal<boolean>(false);

  protected readonly assetTypeOptions = computed(() => {
    const types = this.assets()
      .map((asset) => asset.asset_type_description?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly filteredAssets = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const selectedType = this.selectedAssetType().trim();
    const normalizedType = selectedType.toLowerCase();

    return this.assets().filter((asset) => {
      const name = (asset.asset_name ?? '').toLowerCase();
      const type = (asset.asset_type_description ?? '').toLowerCase();
      const matchesTerm = !term || name.includes(term);
      const matchesType = !selectedType || type === normalizedType;
      return matchesTerm && matchesType;
    });
  });

  ngOnInit(): void {
    this.loadAssets();
  }

  protected loadAssets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.wpaService
      .getAssets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          this.assets.set(assets ?? []);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load assets', err);
          this.error.set('Failed to load assets.');
          this.loading.set(false);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedAssetType.set('');
  }

  protected openCreateDialog(): void {
    this.showDialog.set(true);
  }

  protected closeDialog(): void {
    this.showDialog.set(false);
  }

  protected onAssetSaved(): void {
    this.closeDialog();
    this.loadAssets();
  }

  protected deleteAsset(asset: WpaAsset): void {
    if (!this.isDeletable(asset)) return;

    const confirmed = confirm(`Delete "${asset.asset_name}"?`);
    if (!confirmed) return;

    this.wpaService
      .deleteAsset(asset.asset_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadAssets(),
        error: (error: unknown) => {
          console.error('Failed to delete asset:', error);
        }
      });
  }

  protected isDeletable(asset: WpaAsset): boolean {
    if (!asset.asset_created_at) return false;
    const createdAt = new Date(asset.asset_created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }

  protected formatCreatedAt(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'MMM d, y, HH:mm', 'en-US');
  }

  protected formatCreatedBy(asset: WpaAsset): string {
    return asset.asset_created_by_name || asset.asset_created_by_email || '-';
  }

  protected trackByAssetId(_index: number, asset: WpaAsset): number {
    return asset.asset_id;
  }
}
