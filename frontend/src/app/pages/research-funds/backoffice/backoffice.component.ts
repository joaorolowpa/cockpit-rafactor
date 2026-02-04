import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Fund, FundClassification, FundTransaction, Relationship } from '../../../models/funds.model';
import { FundsService } from '../funds.service';

type BackofficeTab = 'fund_managers' | 'fund_relationships' | 'funds_classifications' | 'transactions_ledger';


@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backoffice.component.html',
  styleUrl: './backoffice.component.scss'
})
export class BackofficeComponent {
  private readonly fundsService = inject(FundsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = [
    { key: 'fund_managers', label: 'Fund Managers', icon: 'fa-solid fa-briefcase' },
    { key: 'fund_relationships', label: 'Fund Relationships', icon: 'fa-solid fa-link' },
    { key: 'funds_classifications', label: 'Funds Classifications', icon: 'fa-solid fa-layer-group' },
    { key: 'transactions_ledger', label: 'Transactions Ledger', icon: 'fa-solid fa-file-lines' }
  ] as const;

  protected activeTab = signal<BackofficeTab>('fund_managers');
  protected searchTerm = signal<string>('');
  protected compactView = signal<boolean>(false);
  protected showColumnMenu = signal<boolean>(false);

  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  protected fundManagers = signal<Fund[]>([]);
  protected relationships = signal<Relationship[]>([]);
  protected classifications = signal<FundClassification[]>([]);
  protected transactions = signal<FundTransaction[]>([]);

  private readonly columnConfig: {
    fund_managers: ColumnDef<Fund>[];
    fund_relationships: ColumnDef<Relationship>[];
    funds_classifications: ColumnDef<FundClassification>[];
    transactions_ledger: ColumnDef<FundTransaction>[];
  } = {
    fund_managers: [
      { key: 'id', label: 'ID', copyable: true, getValue: (item) => item.id },
      { key: 'display_name', label: 'Display Name', copyable: true, getValue: (item) => item.display_name },
      { key: 'created_by_name', label: 'Created By', copyable: true, getValue: (item) => item.created_by_name },
      { key: 'created_at', label: 'Created At', copyable: true, getValue: (item) => item.created_at },
      { key: 'actions', label: 'Actions', copyable: false, getValue: () => '' }
    ],
    fund_relationships: [
      { key: 'id', label: 'ID', copyable: true, getValue: (item) => item.id },
      { key: 'fund_manager_display_name', label: 'Fund Manager', copyable: true, getValue: (item) => item.fund_manager_display_name },
      { key: 'asset_display_name', label: 'Asset', copyable: true, getValue: (item) => item.asset_display_name },
      { key: 'commitment', label: 'Commitment', copyable: true, getValue: (item) => item.commitment },
      { key: 'nav', label: 'NAV', copyable: true, getValue: (item) => item.nav },
      { key: 'irr', label: 'IRR', copyable: true, getValue: (item) => item.irr }
    ],
    funds_classifications: [
      { key: 'display_name', label: 'Display Name', copyable: true, getValue: (item) => item.display_name },
      { key: 'lote45_asset_type', label: 'Asset Type', copyable: true, getValue: (item) => item.lote45_asset_type },
      { key: 'milestones_fund_type', label: 'Fund Type', copyable: true, getValue: (item) => item.milestones_fund_type },
      { key: 'milestones_benchmark', label: 'Benchmark', copyable: true, getValue: (item) => item.milestones_benchmark }
    ],
    transactions_ledger: [
      { key: 'id', label: 'ID', copyable: true, getValue: (item) => item.id },
      { key: 'fund_manager_display_name', label: 'Fund Manager', copyable: true, getValue: (item) => item.fund_manager_display_name },
      { key: 'asset_display_name', label: 'Asset', copyable: true, getValue: (item) => item.asset_display_name },
      { key: 'transaction_type', label: 'Type', copyable: true, getValue: (item) => item.transaction_type },
      { key: 'amount', label: 'Amount', copyable: true, getValue: (item) => item.amount },
      { key: 'transaction_date', label: 'Date', copyable: true, getValue: (item) => item.transaction_date }
    ]
  };

  protected readonly columnVisibility = signal<Record<string, Record<string, boolean>>>({
    fund_managers: {
      id: true,
      display_name: true,
      created_by_name: true,
      created_at: true,
      actions: true
    },
    fund_relationships: {
      id: true,
      fund_manager_display_name: true,
      asset_display_name: true,
      commitment: true,
      nav: true,
      irr: true
    },
    funds_classifications: {
      display_name: true,
      lote45_asset_type: true,
      milestones_fund_type: true,
      milestones_benchmark: true
    },
    transactions_ledger: {
      id: true,
      fund_manager_display_name: true,
      asset_display_name: true,
      transaction_type: true,
      amount: true,
      transaction_date: true
    }
  });

  protected readonly filteredFundManagers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.fundManagers();
    return this.fundManagers().filter((fund) =>
      fund.display_name?.toLowerCase().includes(term)
    );
  });

  protected readonly filteredRelationships = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.relationships();
    return this.relationships().filter((rel) =>
      rel.fund_manager_display_name?.toLowerCase().includes(term)
    );
  });

  protected readonly filteredClassifications = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.classifications();
    return this.classifications().filter((item) =>
      item.display_name?.toLowerCase().includes(term)
    );
  });

  protected readonly filteredTransactions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.transactions();
    return this.transactions().filter((item) =>
      item.fund_manager_display_name?.toLowerCase().includes(term)
    );
  });

  protected readonly topBarConfig = computed(() => {
    const tab = this.activeTab();
    if (tab === 'fund_relationships') {
      return { buttonLabel: 'Add Relationship' };
    }
    if (tab === 'transactions_ledger') {
      return { buttonLabel: 'Add Transaction' };
    }
    return { buttonLabel: 'Add Fund' };
  });

  constructor() {
    const fundManagers$ = this.fundsService
      .getFundManagers()
      .pipe(catchError(() => of([] as Fund[])));

    fundManagers$
      .pipe(
        switchMap((fundManagers) =>
          forkJoin({
            fundManagers: of(fundManagers),
            relationships: (fundManagers.length
              ? this.fundsService.getRelationships(fundManagers.map((fund) => fund.id))
              : of([] as Relationship[])
            ).pipe(catchError(() => of([] as Relationship[]))),
            classifications: this.fundsService
              .getFundClassifications()
              .pipe(catchError(() => of([] as FundClassification[]))),
            transactions: this.fundsService
              .getFundTransactions()
              .pipe(catchError(() => of([] as FundTransaction[])))
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ fundManagers, relationships, classifications, transactions }) => {
          this.fundManagers.set(fundManagers);
          this.relationships.set(relationships);
          this.classifications.set(classifications);
          this.transactions.set(transactions);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load backoffice data.');
          this.isLoading.set(false);
        }
      });
  }

  protected setTab(tab: BackofficeTab): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.showColumnMenu.set(false);
  }

  protected toggleCompactView(): void {
    this.compactView.set(!this.compactView());
  }

  protected toggleColumnMenu(): void {
    this.showColumnMenu.set(!this.showColumnMenu());
  }

  protected isColumnVisible(tab: BackofficeTab, key: string): boolean {
    return this.columnVisibility()[tab]?.[key] !== false;
  }

  protected toggleColumnVisibility(tab: BackofficeTab, key: string): void {
    const current = this.columnVisibility();
    const tabConfig = current[tab] || {};
    this.columnVisibility.set({
      ...current,
      [tab]: {
        ...tabConfig,
        [key]: !tabConfig[key]
      }
    });
  }

  private getVisibleColumnsForFundManagers(includeNonCopyable: boolean): ColumnDef<Fund>[] {
    const visibleKeys = this.columnVisibility()['fund_managers'];
    return this.columnConfig.fund_managers.filter((col) => {
      if (visibleKeys?.[col.key] === false) return false;
      if (col.key === 'actions') return includeNonCopyable;
      return includeNonCopyable ? true : col.copyable;
    });
  }

  private getVisibleColumnsForRelationships(includeNonCopyable: boolean): ColumnDef<Relationship>[] {
    const visibleKeys = this.columnVisibility()['fund_relationships'];
    return this.columnConfig.fund_relationships.filter((col) => {
      if (visibleKeys?.[col.key] === false) return false;
      return includeNonCopyable ? true : col.copyable;
    });
  }

  private getVisibleColumnsForClassifications(includeNonCopyable: boolean): ColumnDef<FundClassification>[] {
    const visibleKeys = this.columnVisibility()['funds_classifications'];
    return this.columnConfig.funds_classifications.filter((col) => {
      if (visibleKeys?.[col.key] === false) return false;
      return includeNonCopyable ? true : col.copyable;
    });
  }

  private getVisibleColumnsForTransactions(includeNonCopyable: boolean): ColumnDef<FundTransaction>[] {
    const visibleKeys = this.columnVisibility()['transactions_ledger'];
    return this.columnConfig.transactions_ledger.filter((col) => {
      if (visibleKeys?.[col.key] === false) return false;
      return includeNonCopyable ? true : col.copyable;
    });
  }

  protected getActiveTabColumns() {
    const tab = this.activeTab();
    if (tab === 'fund_relationships') return this.getVisibleColumnsForRelationships(true);
    if (tab === 'funds_classifications') return this.getVisibleColumnsForClassifications(true);
    if (tab === 'transactions_ledger') return this.getVisibleColumnsForTransactions(true);
    return this.getVisibleColumnsForFundManagers(true);
  }

  protected getActiveTabAllColumns() {
    const tab = this.activeTab();
    if (tab === 'fund_relationships') return this.columnConfig.fund_relationships;
    if (tab === 'funds_classifications') return this.columnConfig.funds_classifications;
    if (tab === 'transactions_ledger') return this.columnConfig.transactions_ledger;
    return this.columnConfig.fund_managers;
  }

  protected copyTable(format: 'us' | 'br'): void {
    const tab = this.activeTab();
    const separator = format === 'us' ? ',' : ';';
    const { headers, rows } = this.getTabData(tab);
    const csv = [
      headers.join(separator),
      ...rows.map((row) => row.map((value) => this.formatValue(value, format)).join(separator))
    ].join('\n');

    navigator.clipboard.writeText(csv).catch((error) => {
      console.error('Failed to copy table:', error);
    });
  }

  protected onPrimaryAction(): void {
    alert('Create flow not implemented yet.');
  }

  protected getSearchPlaceholder(): string {
    const tab = this.activeTab();
    if (tab === 'funds_classifications') {
      return 'Search by display name';
    }
    if (tab === 'transactions_ledger') {
      return 'Search by fund manager';
    }
    if (tab === 'fund_relationships') {
      return 'Search for a fund manager';
    }
    return 'Search for a fund by name';
  }

  private mapColumnValues<T>(columns: ColumnDef<T>[], item: T) {
    return columns.map((col) => col.getValue(item));
  }

  private getTabData(tab: BackofficeTab): { headers: string[]; rows: Array<Array<string | number | null | undefined>> } {
    if (tab === 'fund_relationships') {
      const data = this.filteredRelationships();
      const columns: ColumnDef<Relationship>[] = this.getVisibleColumnsForRelationships(false);
      return {
        headers: columns.map((col) => col.label),
        rows: data.map((item) => this.mapColumnValues(columns, item))
      };
    }

    if (tab === 'funds_classifications') {
      const data = this.filteredClassifications();
      const columns: ColumnDef<FundClassification>[] = this.getVisibleColumnsForClassifications(false);
      return {
        headers: columns.map((col) => col.label),
        rows: data.map((item) => this.mapColumnValues(columns, item))
      };
    }

    if (tab === 'transactions_ledger') {
      const data = this.filteredTransactions();
      const columns: ColumnDef<FundTransaction>[] = this.getVisibleColumnsForTransactions(false);
      return {
        headers: columns.map((col) => col.label),
        rows: data.map((item) => this.mapColumnValues(columns, item))
      };
    }

    const data = this.filteredFundManagers();
    const columns: ColumnDef<Fund>[] = this.getVisibleColumnsForFundManagers(false);
    return {
      headers: columns.map((col) => col.label),
      rows: data.map((item) => this.mapColumnValues(columns, item))
    };
  }

  private formatValue(value: string | number | null | undefined, format: 'us' | 'br'): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString(format === 'us' ? 'en-US' : 'pt-BR');
    }
    return String(value);
  }
}

interface ColumnDef<T> {
  key: string;
  label: string;
  copyable: boolean;
  getValue: (item: T) => string | number | null | undefined;
}
