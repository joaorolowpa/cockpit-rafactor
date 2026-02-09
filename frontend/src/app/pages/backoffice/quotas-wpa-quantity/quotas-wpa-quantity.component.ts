import { CommonModule, formatDate as formatDateFn } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';

import {
  BackofficeQuotasWpaQuantityService,
  QuotaAcquisition,
  WpaAssetWithQuota
} from './quotas-wpa-quantity.service';
import { QuotaAcquisitionFormDialogComponent } from './quota-acquisition-form-dialog/quota-acquisition-form-dialog.component';

type QuotasTabKey = 'quota_acquisition' | 'position_held';

interface QuotasTabConfig {
  key: QuotasTabKey;
  label: string;
  icon: string;
}

type PositionHeldRow = {
  date_reference: string;
  [asset_name: string]: string | number;
};

@Component({
  selector: 'app-backoffice-quotas-wpa-quantity',
  standalone: true,
  imports: [CommonModule, ChartModule, QuotaAcquisitionFormDialogComponent],
  templateUrl: './quotas-wpa-quantity.component.html',
  styleUrl: './quotas-wpa-quantity.component.scss'
})
export class BackofficeQuotasWpaQuantityComponent implements OnInit {
  private readonly quotasService = inject(BackofficeQuotasWpaQuantityService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs: QuotasTabConfig[] = [
    { key: 'quota_acquisition', label: 'WPA Quota Acquisition', icon: 'fa-solid fa-arrow-trend-up' },
    { key: 'position_held', label: 'WPA Position Held', icon: 'fa-solid fa-chart-line' }
  ];

  protected readonly activeTab = signal<QuotasTabKey>('quota_acquisition');
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly assetsLoading = signal<boolean>(true);
  protected readonly assetsError = signal<string | null>(null);

  protected readonly acquisitions = signal<QuotaAcquisition[]>([]);
  protected readonly assetsWithQuota = signal<WpaAssetWithQuota[]>([]);

  protected readonly showForm = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');

  protected readonly filteredAcquisitions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.acquisitions();
    return this.acquisitions().filter((item) =>
      item.asset_name?.toLowerCase().includes(term)
    );
  });

  protected readonly positionData = computed(() => this.buildPositionHeldData(this.acquisitions()));
  protected readonly positionRows = computed(() => this.positionData().rows);
  protected readonly positionAssetNames = computed(() => this.positionData().assetNames);

  protected readonly hasPositionData = computed(
    () => this.positionRows().length > 0 && this.positionAssetNames().length > 0
  );

  protected readonly chartData = computed<ChartData<'line'>>(() =>
    this.buildChartData(this.positionRows(), this.positionAssetNames())
  );

  protected readonly chartOptions: ChartOptions<'line'> = this.buildChartOptions();

  ngOnInit(): void {
    this.loadAcquisitions();
    this.loadAssets();
  }

  protected setTab(tab: QuotasTabKey): void {
    this.activeTab.set(tab);
  }

  protected openForm(): void {
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected handleSaved(): void {
    this.showForm.set(false);
    this.loadAcquisitions();
  }

  protected loadAcquisitions(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.quotasService
      .getQuotaAcquisitions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.acquisitions.set(data ?? []);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load quota acquisitions', err);
          this.error.set('Failed to load quota acquisitions.');
          this.acquisitions.set([]);
          this.isLoading.set(false);
        }
      });
  }

  protected loadAssets(): void {
    this.assetsLoading.set(true);
    this.assetsError.set(null);

    this.quotasService
      .getAssetsWithQuota()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const sorted = [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
          this.assetsWithQuota.set(sorted);
          this.assetsLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load assets with quota', err);
          this.assetsError.set('Failed to load assets with quota.');
          this.assetsWithQuota.set([]);
          this.assetsLoading.set(false);
        }
      });
  }

  protected deleteAcquisition(acquisition: QuotaAcquisition): void {
    if (!this.canDelete(acquisition)) return;
    const confirmed = confirm(
      `Delete acquisition for ${acquisition.asset_name} on ${acquisition.date_reference}?`
    );
    if (!confirmed) return;

    this.quotasService
      .deleteQuotaAcquisition(acquisition.quota_acquisition_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadAcquisitions(),
        error: (err: unknown) => {
          console.error('Failed to delete acquisition', err);
        }
      });
  }

  protected canDelete(acquisition: QuotaAcquisition): boolean {
    const date = new Date(acquisition.date_reference);
    if (Number.isNaN(date.getTime())) return true;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 365;
  }

  protected formatDateReference(value: unknown): string {
    if (!value) return '-';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return formatDateFn(date, 'yyyy-MM-dd', 'en-US');
  }

  protected formatQuantity(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  protected formatUnitValue(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    });
  }

  protected formatPositionNumber(value: unknown): string {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    if (Number.isNaN(numeric)) return '-';
    return numeric.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  protected copyAcquisitionTable(): void {
    const rows = this.filteredAcquisitions();
    if (!rows.length) return;

    const headers = ['Date Reference', 'Asset Name', 'Quantity', 'Unit Value', 'Comment'];
    const dataRows = rows.map((row) =>
      [
        row.date_reference,
        row.asset_name,
        row.quantidade_cotas.toFixed(2),
        row.valor_cota.toFixed(8),
        row.comment ?? ''
      ].join('\t')
    );

    const content = [headers.join('\t'), ...dataRows].join('\n');
    navigator.clipboard.writeText(content).catch((error) => {
      console.error('Failed to copy table', error);
    });
  }

  protected exportAcquisitionsCsv(locale: 'USA' | 'BR'): void {
    const rows = this.filteredAcquisitions();
    if (!rows.length) return;

    const separator = locale === 'BR' ? ';' : ',';
    const headers = ['date_reference', 'asset_name', 'quantidade_cotas', 'valor_cota', 'comment'];
    const dataRows = rows.map((row) =>
      [
        row.date_reference,
        row.asset_name,
        locale === 'BR'
          ? row.quantidade_cotas.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          : row.quantidade_cotas.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }),
        locale === 'BR'
          ? row.valor_cota.toLocaleString('pt-BR', {
              minimumFractionDigits: 8,
              maximumFractionDigits: 8
            })
          : row.valor_cota.toLocaleString('en-US', {
              minimumFractionDigits: 8,
              maximumFractionDigits: 8
            }),
        row.comment ?? ''
      ].join(separator)
    );

    const csvContent = [headers.join(separator), ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wpa_quota_acquisition_${locale.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected copyPositionTable(): void {
    const rows = this.positionRows();
    const assets = this.positionAssetNames();
    if (!rows.length || !assets.length) return;

    const headers = ['Date Reference', ...assets];
    const dataRows = rows.map((row) =>
      [
        row['date_reference'],
        ...assets.map((asset) => this.formatPositionNumber(Number(row[asset] ?? 0)))
      ].join('\t')
    );

    const content = [headers.join('\t'), ...dataRows].join('\n');
    navigator.clipboard.writeText(content).catch((error) => {
      console.error('Failed to copy table', error);
    });
  }

  protected trackByAcquisition(_index: number, row: QuotaAcquisition): number {
    return row.quota_acquisition_id;
  }

  protected trackByTab(_index: number, tab: QuotasTabConfig): QuotasTabKey {
    return tab.key;
  }

  protected trackByPositionRow(index: number, _row: PositionHeldRow): number {
    return index;
  }

  protected trackByColumn(_index: number, column: string): string {
    return column;
  }

  protected trackByAssetName(_index: number, asset: string): string {
    return asset;
  }

  private buildPositionHeldData(acquisitions: QuotaAcquisition[]) {
    if (!Array.isArray(acquisitions) || acquisitions.length === 0) {
      return { rows: [] as PositionHeldRow[], assetNames: [] as string[] };
    }

    const assetNames = Array.from(new Set(acquisitions.map((item) => item.asset_name))).sort((a, b) =>
      a.localeCompare(b)
    );
    const dates = Array.from(new Set(acquisitions.map((item) => item.date_reference))).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const cumulative = new Map<string, Map<string, number>>();
    dates.forEach((date) => {
      const map = new Map<string, number>();
      assetNames.forEach((asset) => map.set(asset, 0));
      cumulative.set(date, map);
    });

    acquisitions.forEach((item) => {
      const asset = item.asset_name;
      const quantity = item.quantidade_cotas;
      dates.forEach((date) => {
        if (new Date(date) >= new Date(item.date_reference)) {
          const map = cumulative.get(date);
          if (!map) return;
          map.set(asset, (map.get(asset) ?? 0) + quantity);
        }
      });
    });

    const rows = dates.map((date) => {
      const row: PositionHeldRow = { date_reference: date };
      assetNames.forEach((asset) => {
        row[asset] = cumulative.get(date)?.get(asset) ?? 0;
      });
      return row;
    });

    return { rows, assetNames };
  }

  private buildChartData(rows: PositionHeldRow[], assets: string[]): ChartData<'line'> {
    if (!rows.length || !assets.length) {
      return { labels: [], datasets: [] };
    }
    const labels = rows.map((row) => row['date_reference']);
    const colors = [
      '#2563eb',
      '#16a34a',
      '#f97316',
      '#9333ea',
      '#0ea5e9',
      '#dc2626',
      '#a855f7',
      '#f59e0b',
      '#10b981',
      '#64748b'
    ];

    return {
      labels,
      datasets: assets.map((asset, index) => ({
        label: asset,
        data: rows.map((row) => Number(row[asset] ?? 0)),
        borderColor: colors[index % colors.length],
        backgroundColor: 'transparent',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 2
      }))
    };
  }

  private buildChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
              const label = context.dataset.label ?? 'Series';
              return `${label}: ${this.formatPositionNumber(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          ticks: {
            callback: (value) => {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isNaN(numeric)) return String(value);
              if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`;
              if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
              return String(Math.round(numeric));
            }
          }
        }
      }
    };
  }
}
