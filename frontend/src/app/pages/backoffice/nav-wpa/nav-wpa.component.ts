import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin } from 'rxjs';

import {
  BackofficeNavWpaService,
  NavProfitabilityData,
  WpaPosition
} from './nav-wpa.service';
import { UI_IMPORTS } from '../../../ui/ui.imports';

type ChartDataPoint = {
  date_reference: string;
  [assetName: string]: string | number;
};

type ProcessedChartData = {
  data: ChartDataPoint[];
  assets: string[];
  dateRange: { min: string; max: string };
};

type LatestAssetValue = {
  assetName: string;
  displayName: string;
  value: number;
  formattedValue: string;
};

@Component({
  selector: 'app-backoffice-nav-wpa',
  standalone: true,
  imports: [CommonModule, ChartModule, ...UI_IMPORTS],
  templateUrl: './nav-wpa.component.html',
  styleUrl: './nav-wpa.component.scss'
})
export class BackofficeNavWpaComponent implements OnInit {
  private readonly navService = inject(BackofficeNavWpaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly positions = signal<WpaPosition[]>([]);
  protected readonly profitability = signal<NavProfitabilityData[]>([]);

  protected readonly consolidateStocksEnabled = signal<boolean>(true);
  protected readonly selectedDate = signal<string>(this.formatDateForInput(new Date()));

  protected readonly processedChartData = computed(() =>
    this.transformWpaPositionsForCharts(this.positions())
  );

  protected readonly consolidatedChartData = computed(() => {
    const base = this.processedChartData();
    if (!this.consolidateStocksEnabled()) return base;
    const consolidated = this.consolidateStocks(base.data, base.assets);
    return {
      data: consolidated.data,
      assets: consolidated.assets,
      dateRange: base.dateRange
    };
  });

  protected readonly displayChartData = computed(() => {
    const base = this.consolidatedChartData();
    return this.applyHumanReadableNames(base.data, base.assets);
  });

  protected readonly percentageChartData = computed(() => {
    const base = this.consolidatedChartData();
    const percentage = this.transformToPercentageData(base.data, base.assets);
    return this.applyHumanReadableNames(percentage, base.assets);
  });

  protected readonly latestValues = computed(() =>
    this.getLatestValues(this.consolidatedChartData().data, this.consolidatedChartData().assets)
  );

  protected readonly latestValuesDisplay = computed(() => {
    const values = this.latestValues();
    const total = values.reduce((sum, item) => sum + item.value, 0);
    return values.map((item) => ({
      ...item,
      percentage: total ? (item.value / total) * 100 : 0
    }));
  });

  protected readonly totalLatestValue = computed(() =>
    this.latestValues().reduce((sum, item) => sum + item.value, 0)
  );

  protected readonly formattedSelectedDate = computed(() => {
    const value = this.selectedDate();
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
  });

  protected readonly lineChartData = computed(() =>
    this.buildLineChartData(this.displayChartData().data, this.displayChartData().assets, false)
  );

  protected readonly stackedChartData = computed(() =>
    this.buildLineChartData(this.displayChartData().data, this.displayChartData().assets, true)
  );

  protected readonly percentageLineChartData = computed(() =>
    this.buildLineChartData(this.percentageChartData().data, this.percentageChartData().assets, true)
  );

  protected readonly pieChartData = computed(() => this.buildPieChartData(this.latestValues()));

  protected readonly profitabilityChartData = computed(() =>
    this.buildProfitabilityChartData(this.profitability())
  );

  protected readonly lineChartOptions = this.buildLineChartOptions(false);
  protected readonly stackedChartOptions = this.buildLineChartOptions(true);
  protected readonly percentageChartOptions = this.buildPercentageChartOptions();
  protected readonly pieChartOptions = this.buildPieChartOptions();
  protected readonly profitabilityChartOptions = this.buildProfitabilityChartOptions();

  ngOnInit(): void {
    this.loadNavData();
  }

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.loadNavData();
  }

  protected toggleConsolidate(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.consolidateStocksEnabled.set(checked);
  }

  protected loadNavData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const dateReference = this.selectedDate() || undefined;

    forkJoin({
      positions: this.navService.getWpaPositions(dateReference),
      profitability: this.navService.getNavProfitability(dateReference)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ positions, profitability }) => {
          this.positions.set(positions ?? []);
          this.profitability.set(profitability ?? []);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load NAV data', err);
          this.error.set('Failed to load NAV data.');
          this.positions.set([]);
          this.profitability.set([]);
          this.isLoading.set(false);
        }
      });
  }

  protected formatCurrencyInMillions(value: number): string {
    const valueInMillions = value / 1000000;
    return (
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(valueInMillions) + 'M'
    );
  }

  protected formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  protected formatDateLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(date);
  }

  protected trackByAssetName(_index: number, asset: string): string {
    return asset;
  }

  protected trackByLatest(_index: number, item: LatestAssetValue): string {
    return item.assetName;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildLineChartData(data: ChartDataPoint[], assets: string[], fill: boolean): ChartData<'line'> {
    const colors = this.generateColors(assets.length);
    const labels = data.map((item) => this.formatDateLabel(item.date_reference));

    return {
      labels,
      datasets: assets.map((asset, index) => ({
        label: asset,
        data: data.map((item) => Number(item[asset] ?? 0)),
        borderColor: colors[index],
        backgroundColor: fill ? this.withAlpha(colors[index], 0.35) : colors[index],
        fill: fill ? 'origin' : false,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        stack: fill ? 'stack-1' : undefined
      }))
    };
  }

  private buildPieChartData(values: LatestAssetValue[]): ChartData<'pie'> {
    const colors = this.generateColors(values.length);
    return {
      labels: values.map((item) => item.displayName),
      datasets: [
        {
          data: values.map((item) => item.value),
          backgroundColor: colors
        }
      ]
    };
  }

  private buildProfitabilityChartData(data: NavProfitabilityData[]): ChartData<'line'> {
    return {
      labels: data.map((item) => this.formatDateLabel(item.month_end)),
      datasets: [
        {
          label: 'NAV Index',
          data: data.map((item) => item.nav_index ?? 0),
          borderColor: '#22c55e',
          backgroundColor: this.withAlpha('#22c55e', 0.25),
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 3
        }
      ]
    };
  }

  private buildLineChartOptions(stacked: boolean): ChartOptions<'line'> {
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
              const label = context.dataset.label ?? 'Series';
              const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
              return stacked
                ? `${label}: ${this.formatCurrencyInMillions(value)}`
                : `${label}: ${this.formatCurrencyInMillions(value)}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked
        },
        y: {
          stacked,
          ticks: {
            callback: (value) => {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isNaN(numeric)) return String(value);
              if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`;
              if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
              return `${Math.round(numeric)}`;
            }
          }
        }
      }
    };
  }

  private buildPercentageChartOptions(): ChartOptions<'line'> {
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
              const label = context.dataset.label ?? 'Series';
              const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
              return `${label}: ${this.formatPercentage(value)}`;
            }
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${Math.round(Number(value))}%`
          }
        }
      }
    };
  }

  private buildPieChartOptions(): ChartOptions<'pie'> {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label ?? '';
              const value = context.parsed as number;
              const total = (context.dataset.data as number[]).reduce((sum, item) => sum + item, 0);
              const percentage = total ? (value / total) * 100 : 0;
              return `${label}: ${this.formatCurrencyInMillions(value)} (${percentage.toFixed(1)}%)`;
            }
          }
        }
      }
    };
  }

  private buildProfitabilityChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => Number(value).toFixed(2)
          }
        }
      }
    };
  }

  private transformWpaPositionsForCharts(data: WpaPosition[]): ProcessedChartData {
    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], assets: [], dateRange: { min: '', max: '' } };
    }

    const dateToValuesMap = new Map<string, Record<string, number>>();
    const assetNamesSet = new Set<string>();

    data.forEach((item) => {
      if (item.asset_name) assetNamesSet.add(item.asset_name);
      if (!dateToValuesMap.has(item.date_reference)) {
        dateToValuesMap.set(item.date_reference, {});
      }
      const dateValues = dateToValuesMap.get(item.date_reference)!;
      dateValues[item.asset_name] = item.position_value_adj;
    });

    const assets = Array.from(assetNamesSet).sort((a, b) => a.localeCompare(b));
    const sortedDates = Array.from(dateToValuesMap.keys()).sort();

    const chartData: ChartDataPoint[] = sortedDates.map((date) => {
      const values = dateToValuesMap.get(date) ?? {};
      const point: ChartDataPoint = { date_reference: date };
      assets.forEach((asset) => {
        point[asset] = values[asset] ?? 0;
      });
      return point;
    });

    return {
      data: chartData,
      assets,
      dateRange: {
        min: sortedDates[0] ?? '',
        max: sortedDates[sortedDates.length - 1] ?? ''
      }
    };
  }

  private transformToPercentageData(data: ChartDataPoint[], assets: string[]): ChartDataPoint[] {
    return data.map((point) => {
      const total = assets.reduce((sum, asset) => sum + Number(point[asset] ?? 0), 0);
      const percentagePoint: ChartDataPoint = { date_reference: point.date_reference };
      assets.forEach((asset) => {
        const value = Number(point[asset] ?? 0);
        percentagePoint[asset] = total ? (value / total) * 100 : 0;
      });
      return percentagePoint;
    });
  }

  private getLatestValues(data: ChartDataPoint[], assets: string[]): LatestAssetValue[] {
    if (!data || data.length === 0) return [];
    const latest = data[data.length - 1];
    const values = assets
      .map((asset) => {
        const value = Number(latest[asset] ?? 0);
        return {
          assetName: asset,
          displayName: this.getHumanReadableName(asset),
          value,
          formattedValue: this.formatCurrencyInMillions(value)
        };
      })
      .filter((item) => item.value > 0);

    return values.sort((a, b) => b.value - a.value);
  }

  private applyHumanReadableNames(
    data: ChartDataPoint[],
    assets: string[]
  ): { data: ChartDataPoint[]; assets: string[] } {
    const transformedAssets = assets.map((asset) => this.getHumanReadableName(asset));

    const transformedData = data.map((point) => {
      const newPoint: ChartDataPoint = { date_reference: point.date_reference };
      assets.forEach((asset) => {
        const readable = this.getHumanReadableName(asset);
        newPoint[readable] = point[asset];
      });
      return newPoint;
    });

    return { data: transformedData, assets: transformedAssets };
  }

  private consolidateStocks(
    data: ChartDataPoint[],
    assets: string[]
  ): { data: ChartDataPoint[]; assets: string[] } {
    const consolidatedData = data.map((point) => {
      const newPoint: ChartDataPoint = { date_reference: point.date_reference };
      let stocksTotal = 0;

      assets.forEach((asset) => {
        if (this.isStockSymbol(asset)) {
          stocksTotal += Number(point[asset] ?? 0);
        } else {
          newPoint[asset] = point[asset];
        }
      });

      if (stocksTotal > 0) {
        newPoint['Stocks'] = stocksTotal;
      }

      return newPoint;
    });

    const nonStockAssets = assets.filter((asset) => !this.isStockSymbol(asset));
    const hasStocks = assets.some((asset) => this.isStockSymbol(asset));
    const consolidatedAssets = hasStocks ? ['Stocks', ...nonStockAssets] : nonStockAssets;

    return { data: consolidatedData, assets: consolidatedAssets };
  }

  private getHumanReadableName(assetName: string): string {
    const mapping: Record<string, string> = {
      SALDO_PARTICIPACAO_OXFORD_SA: 'Oxford',
      'WPA_GLOBAL_(EST)': 'WPA Global (Est)',
      WPA_I: 'WPA I',
      WPA_II: 'WPA II',
      WPA_III: 'WPA III',
      WPA_INTERNATIONAL: 'WPA International',
      WPA_IV: 'WPA IV'
    };
    return mapping[assetName] ?? assetName;
  }

  private isStockSymbol(assetName: string): boolean {
    const stocks = [
      'BBAS3',
      'BBDC4',
      'BRFS3',
      'CLSC4',
      'CMIG3',
      'CMIG4',
      'CPFE3',
      'EGIE3',
      'ITUB4',
      'PETR4',
      'TRPL4',
      'USIM5',
      'VALE5'
    ];
    return stocks.includes(assetName);
  }

  private generateColors(count: number): string[] {
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
    const result = [...colors];
    if (count > result.length) {
      for (let i = result.length; i < count; i += 1) {
        const hue = (i * 137.508) % 360;
        result.push(`hsl(${hue}, 70%, 50%)`);
      }
    }
    return result.slice(0, count);
  }

  private withAlpha(color: string, alpha: number): string {
    if (color.startsWith('hsl(')) {
      return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
    }
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const bigint = parseInt(hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
}
