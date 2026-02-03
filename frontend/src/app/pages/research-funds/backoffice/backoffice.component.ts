import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Fund, FundClassification, FundTransaction, Relationship } from '../../../models/funds.model';
import { FundsService } from '../funds.service';

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

  protected activeTab = signal<typeof this.tabs[number]['key']>('fund_managers');
  protected searchTerm = signal<string>('');
  protected compactView = signal<boolean>(false);

  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);

  protected fundManagers = signal<Fund[]>([]);
  protected relationships = signal<Relationship[]>([]);
  protected classifications = signal<FundClassification[]>([]);
  protected transactions = signal<FundTransaction[]>([]);

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

  protected setTab(tab: typeof this.tabs[number]['key']): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
  }

  protected toggleCompactView(): void {
    this.compactView.set(!this.compactView());
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

  private getTabData(tab: typeof this.tabs[number]['key']): { headers: string[]; rows: Array<Array<string | number | null | undefined>> } {
    if (tab === 'fund_relationships') {
      const data = this.filteredRelationships();
      return {
        headers: ['ID', 'Fund Manager', 'Asset', 'Commitment', 'NAV', 'IRR'],
        rows: data.map((item) => [
          item.id,
          item.fund_manager_display_name,
          item.asset_display_name,
          item.commitment,
          item.nav,
          item.irr
        ])
      };
    }

    if (tab === 'funds_classifications') {
      const data = this.filteredClassifications();
      return {
        headers: ['Display Name', 'Asset Type', 'Fund Type', 'Benchmark'],
        rows: data.map((item) => [
          item.display_name,
          item.lote45_asset_type,
          item.milestones_fund_type,
          item.milestones_benchmark
        ])
      };
    }

    if (tab === 'transactions_ledger') {
      const data = this.filteredTransactions();
      return {
        headers: ['ID', 'Fund Manager', 'Asset', 'Type', 'Amount', 'Date'],
        rows: data.map((item) => [
          item.id,
          item.fund_manager_display_name,
          item.asset_display_name,
          item.transaction_type,
          item.amount,
          item.transaction_date
        ])
      };
    }

    const data = this.filteredFundManagers();
    return {
      headers: ['ID', 'Display Name', 'Created By', 'Created At'],
      rows: data.map((item) => [
        item.id,
        item.display_name,
        item.created_by_name,
        item.created_at
      ])
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
