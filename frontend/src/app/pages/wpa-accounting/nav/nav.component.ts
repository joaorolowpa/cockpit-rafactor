import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgChartOptions } from 'ag-charts-community';
import { AgChartsModule } from 'ag-charts-angular';
import 'ag-charts-enterprise';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  AssetValue,
  DistinctAssetValue,
  GroupedAssetValue,
  WpaAccountingService,
  WpaWeightsResponse
} from '../wpa-accounting.service';

type NavTab = 'tables_illiquid' | 'chart_liquid' | 'tables_liquid';

type TreemapChild = {
  name: string;
  value: number;
  percentage: string;
};

type TreemapNode = {
  name: string;
  children: TreemapChild[];
};

const COLOR_PALETTE = [
  '#7f470a',
  '#8a571e',
  '#aa8666',
  '#b4967c',
  '#bfa594',
  '#a7958b',
  '#8d8280',
  '#767177',
  '#5d5f6c',
  '#2c3b5a'
];

const CATEGORY_LABELS: Record<string, string> = {
  gestao: 'Gestão',
  onoff: 'On/Off',
  pubxpvt: 'Public/Private',
  classe: 'Classe',
  geography: 'Geography',
  tema: 'Tema'
};

const LABEL_DICTIONARY: Record<string, string> = {
  gestao_propria: 'Gestão Própria',
  gestao_terceiros: 'Gestão de Terceiros',
  gestao_other: 'Outros',
  onoff_offshore: 'Offshore',
  onoff_onshore: 'Onshore',
  onoff_other: 'Outros',
  pubxpvt_public: 'Público',
  pubxpvt_private: 'Privado',
  pubxpvt_other: 'Outros',
  classe_acoes: 'Ações',
  classe_private_equity: 'Private Equity',
  classe_caixa: 'Caixa',
  classe_private_debt: 'Private Debt',
  classe_real_estate: 'Real Estate',
  classe_renda_fixa: 'Renda Fixa',
  classe_hedge_funds: 'Hedge Funds',
  classe_credito_alternativo: 'Crédito Alternativo',
  classe_other: 'Outros',
  geography_usa: 'USA',
  geography_brazil: 'Brazil',
  geography_europe: 'Europe',
  geography_china: 'China',
  geography_india: 'India',
  geography_latam: 'LATAM',
  geography_asia_ex_jp: 'Asia ex-Japan',
  geography_africa: 'Africa',
  geography_global: 'Global',
  geography_japan: 'Japan',
  geography_se_asia: 'Southeast Asia',
  geography_other: 'Outros',
  tema_technology: 'Technology',
  tema_caixa: 'Caixa',
  tema_financial: 'Financial',
  tema_utilities: 'Utilities',
  tema_fundos_globais: 'Fundos Globais',
  tema_industrial: 'Industrial',
  tema_credito: 'Crédito',
  tema_fia_br: 'FIA BR',
  tema_real_estate: 'Real Estate',
  tema_life_sciences: 'Life Sciences',
  tema_e_commerce: 'E-Commerce',
  tema_consumer: 'Consumer',
  tema_em_asia: 'Emerging Asia',
  tema_healthcare: 'Healthcare',
  tema_ntnb: 'NTNB',
  tema_beauty: 'Beauty',
  tema_climate: 'Climate',
  tema_chemicals: 'Chemicals',
  tema_special_situations: 'Special Situations',
  tema_commodity: 'Commodity',
  tema_macro: 'Macro',
  tema_luxury: 'Luxury',
  tema_energy: 'Energy',
  tema_other: 'Outros'
};

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, AgChartsModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  private readonly wpaService = inject(WpaAccountingService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = [
    {
      key: 'tables_illiquid' as const,
      label: 'Tables - Illiquid',
      icon: 'fa-solid fa-table',
      color: '#217346'
    },
    {
      key: 'chart_liquid' as const,
      label: 'Charts - Liquid Assets',
      icon: 'fa-solid fa-chart-column',
      color: '#D17C19'
    },
    {
      key: 'tables_liquid' as const,
      label: 'Tables - Liquid Assets',
      icon: 'fa-solid fa-table',
      color: '#2A579A'
    }
  ];

  protected activeTab = signal<NavTab>('tables_illiquid');

  protected availableDates = signal<string[]>([]);
  protected availableDatesLoading = signal<boolean>(true);
  protected availableDatesError = signal<string | null>(null);

  protected illiquidDate = signal<string>(this.getTodayDateString());
  protected illiquidGrouped = signal<GroupedAssetValue[]>([]);
  protected illiquidDistinct = signal<DistinctAssetValue[]>([]);
  protected illiquidLoading = signal<boolean>(false);
  protected illiquidError = signal<string | null>(null);

  protected liquidDate = signal<string>('');
  protected liquidValues = signal<AssetValue[]>([]);
  protected liquidLoading = signal<boolean>(false);
  protected liquidError = signal<string | null>(null);

  protected liquidChartData = signal<TreemapNode[]>([]);
  protected liquidChartOptions = signal<AgChartOptions | null>(null);
  protected weightsLoading = signal<boolean>(false);
  protected weightsError = signal<string | null>(null);

  private lastLiquidDateLoaded = '';
  private lastWeightsDateLoaded = '';

  constructor() {
    this.loadAvailableDates();
    this.loadIlliquidTables();
  }

  protected setTab(tab: NavTab): void {
    this.activeTab.set(tab);
    if (tab === 'tables_liquid') {
      this.loadLiquidTables();
    }
    if (tab === 'chart_liquid') {
      this.loadLiquidCharts();
    }
  }

  protected onIlliquidDateChange(value: string): void {
    if (!value) return;
    this.illiquidDate.set(value);
    this.loadIlliquidTables();
  }

  protected onLiquidDateChange(value: string): void {
    if (!value) return;
    this.liquidDate.set(value);
    if (this.activeTab() === 'tables_liquid') {
      this.loadLiquidTables();
    }
    if (this.activeTab() === 'chart_liquid') {
      this.loadLiquidCharts();
    }
  }

  protected formatBrlValue(value: number | null): string {
    if (value === null || value === undefined) return '-';
    return Math.abs(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  protected formatNumber(value: number | null): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  protected formatCurrencyBRL(value: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'BRL' });
  }

  protected formatPercentage(value: number | null): string {
    if (value === null || value === undefined) return '0%';
    return `${(parseFloat(value.toFixed(2)) * 100).toFixed(2)}%`;
  }

  protected formatFxRate(value: number | null): string {
    if (value === null || value === undefined) return '0';
    return parseFloat(value.toFixed(2)).toString();
  }

  private loadAvailableDates(): void {
    this.availableDatesLoading.set(true);
    this.availableDatesError.set(null);

    this.wpaService
      .getPortfoliosAvailableDates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dates) => {
          this.availableDates.set(dates ?? []);
          this.availableDatesLoading.set(false);
          if (!this.liquidDate() && dates?.length) {
            this.liquidDate.set(dates[0]);
            const tab = this.activeTab();
            if (tab === 'tables_liquid') {
              this.loadLiquidTables();
            }
            if (tab === 'chart_liquid') {
              this.loadLiquidCharts();
            }
          }
        },
        error: (err: unknown) => {
          console.error('Failed to load available dates', err);
          this.availableDatesError.set('Failed to load available dates.');
          this.availableDatesLoading.set(false);
        }
      });
  }

  private loadIlliquidTables(): void {
    const dateReference = this.illiquidDate();
    this.illiquidLoading.set(true);
    this.illiquidError.set(null);
    let hadError = false;

    forkJoin({
      grouped: this.wpaService.getAssetsValuesGrouped(dateReference).pipe(
        catchError((err) => {
          console.error('Failed to load grouped assets values', err);
          hadError = true;
          return of([] as GroupedAssetValue[]);
        })
      ),
      distinct: this.wpaService.getAssetsValuesDistinct(dateReference).pipe(
        catchError((err) => {
          console.error('Failed to load distinct assets values', err);
          hadError = true;
          return of([] as DistinctAssetValue[]);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ grouped, distinct }) => {
          this.illiquidGrouped.set(grouped);
          this.illiquidDistinct.set(distinct);
          if (hadError && grouped.length === 0 && distinct.length === 0) {
            this.illiquidError.set('Failed to load illiquid tables.');
          }
          this.illiquidLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load illiquid tables', err);
          this.illiquidError.set('Failed to load illiquid tables.');
          this.illiquidLoading.set(false);
        }
      });
  }

  private loadLiquidTables(): void {
    const dateReference = this.liquidDate();
    if (!dateReference) return;
    if (this.lastLiquidDateLoaded === dateReference && this.liquidValues().length) return;

    this.liquidLoading.set(true);
    this.liquidError.set(null);

    this.wpaService
      .getAssetsValuesFundsConsolidated(dateReference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.liquidValues.set(data ?? []);
          this.lastLiquidDateLoaded = dateReference;
          this.liquidLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load liquid assets table', err);
          this.liquidError.set('Failed to load liquid assets table.');
          this.liquidLoading.set(false);
        }
      });
  }

  private loadLiquidCharts(): void {
    const dateReference = this.liquidDate();
    if (!dateReference) return;
    if (this.lastWeightsDateLoaded === dateReference && this.liquidChartData().length) return;

    this.weightsLoading.set(true);
    this.weightsError.set(null);

    this.wpaService
      .getWpaWeights(dateReference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const chartData = this.formatWpaWeights(data);
          this.liquidChartData.set(chartData);
          this.liquidChartOptions.set(this.buildTreemapOptions(chartData));
          this.lastWeightsDateLoaded = dateReference;
          this.weightsLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load WPA weights', err);
          this.weightsError.set('Failed to load WPA weights.');
          this.liquidChartData.set([]);
          this.liquidChartOptions.set(null);
          this.weightsLoading.set(false);
        }
      });
  }

  private formatWpaWeights(data: WpaWeightsResponse | null | undefined): TreemapNode[] {
    if (!data) return [];

    return Object.entries(data).map(([key, value]) => {
      const entries = Object.entries(value ?? {});
      const total = entries.reduce((sum, [, subValue]) => sum + (subValue ?? 0), 0);
      const children = entries.map(([subKey, subValue]) => {
        const safeValue = subValue ?? 0;
        return {
          name: LABEL_DICTIONARY[subKey] ?? subKey,
          value: safeValue / 1_000_000,
          percentage: total ? `${((safeValue / total) * 100).toFixed(2)}%` : '0.00%'
        };
      });

      return {
        name: CATEGORY_LABELS[key] ?? key,
        children
      };
    });
  }

  private buildTreemapOptions(data: TreemapNode[]): AgChartOptions {
    return {
      data,
      series: [
        {
          type: 'treemap',
          labelKey: 'name',
          secondaryLabelKey: 'percentage',
          sizeKey: 'value',
          colorKey: 'value',
          colorRange: COLOR_PALETTE,
          group: {
            padding: 12,
            gap: 5
          },
          tile: {
            padding: 8,
            gap: 2
          },
          tooltip: {
            renderer: (params: { datum: { name?: string; value?: number } }) => {
              if (params.datum.value === undefined) {
                return { content: `${params.datum.name}: N/A` };
              }

              return {
                content: `${params.datum.name}: ${params.datum?.value?.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}`
              };
            }
          }
        }
      ],
      gradientLegend: {
        gradient: {
          thickness: 20,
          preferredLength: 400
        }
      }
    };
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
