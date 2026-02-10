import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { WpaAccountingService, WpaAsset, WpaDepositLedger } from '../wpa-accounting.service';
import { DepositLedgerFormDialogComponent } from './deposit-ledger-form-dialog/deposit-ledger-form-dialog.component';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-deposits-ledger',
  standalone: true,
  imports: [CommonModule, DepositLedgerFormDialogComponent, ...UI_IMPORTS],
  templateUrl: './deposits-ledger.component.html',
  styleUrl: './deposits-ledger.component.scss'
})
export class DepositsLedgerComponent implements OnInit {
  private readonly wpaService = inject(WpaAccountingService);
  private readonly destroyRef = inject(DestroyRef);

  protected deposits = signal<WpaDepositLedger[]>([]);
  protected availableAssets = signal<WpaAsset[]>([]);
  protected searchTerm = signal<string>('');
  protected selectedDepositType = signal<string>('');
  protected selectedAssetName = signal<string>('');
  protected selectedAssetType = signal<string>('');
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);
  protected showDialog = signal<boolean>(false);
  protected confirmTarget = signal<WpaDepositLedger | null>(null);

  protected readonly depositTypeOptions = computed(() => {
    const types = this.deposits()
      .map((item) => item.deposit_type?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly assetNameOptions = computed(() => {
    const names = this.deposits()
      .map((item) => item.asset_name?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly assetTypeOptions = computed(() => {
    const types = this.deposits()
      .map((item) => item.asset_type_name?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  });

  protected readonly filteredDeposits = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const selectedType = this.selectedDepositType().trim().toLowerCase();
    const selectedName = this.selectedAssetName().trim().toLowerCase();
    const selectedAssetType = this.selectedAssetType().trim().toLowerCase();

    return this.deposits().filter((item) => {
      const assetName = (item.asset_name ?? '').toLowerCase();
      const assetType = (item.asset_type_name ?? '').toLowerCase();
      const depositType = (item.deposit_type ?? '').toLowerCase();

      const matchesTerm = !term || assetName.includes(term);
      const matchesDepositType = !selectedType || depositType === selectedType;
      const matchesAssetName = !selectedName || assetName === selectedName;
      const matchesAssetType = !selectedAssetType || assetType === selectedAssetType;

      return matchesTerm && matchesDepositType && matchesAssetName && matchesAssetType;
    });
  });

  ngOnInit(): void {
    this.loadDeposits();
  }

  protected loadDeposits(): void {
    this.loading.set(true);
    this.error.set(null);
    let hadError = false;

    forkJoin({
      deposits: this.wpaService.getDepositsLedger().pipe(
        catchError((err) => {
          console.error('Failed to load deposits ledger', err);
          hadError = true;
          return of([] as WpaDepositLedger[]);
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
        next: ({ deposits, assets }) => {
          this.deposits.set(deposits ?? []);
          this.availableAssets.set(assets ?? []);
          if (hadError && deposits.length === 0) {
            this.error.set('Failed to load deposits ledger.');
          }
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load deposits ledger', err);
          this.error.set('Failed to load deposits ledger.');
          this.loading.set(false);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDepositType.set('');
    this.selectedAssetName.set('');
    this.selectedAssetType.set('');
  }

  protected openCreateDialog(): void {
    this.showDialog.set(true);
  }

  protected closeDialog(): void {
    this.showDialog.set(false);
  }

  protected onDepositSaved(): void {
    this.closeDialog();
    this.loadDeposits();
  }

  protected requestDeleteDeposit(deposit: WpaDepositLedger): void {
    if (!this.isDeletable(deposit)) return;
    if (!deposit.deposit_id) return;
    this.confirmTarget.set(deposit);
  }

  protected confirmDeleteDeposit(): void {
    const deposit = this.confirmTarget();
    if (!deposit?.deposit_id) return;
    this.confirmTarget.set(null);

    this.wpaService
      .deleteDepositLedger(deposit.deposit_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadDeposits(),
        error: (error: unknown) => {
          console.error('Failed to delete deposit:', error);
        }
      });
  }

  protected cancelDeleteDeposit(): void {
    this.confirmTarget.set(null);
  }

  protected isDeletable(deposit: WpaDepositLedger): boolean {
    if (!deposit.deposit_created_at) return false;
    const createdAt = new Date(deposit.deposit_created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }

  protected formatBrl(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  protected formatUsd(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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

  protected formatCreatedBy(deposit: WpaDepositLedger): string {
    return deposit.deposit_created_by_name || deposit.deposit_created_by_email || '-';
  }

  protected trackByDepositId(_index: number, item: WpaDepositLedger): number {
    return item.deposit_id;
  }
}
