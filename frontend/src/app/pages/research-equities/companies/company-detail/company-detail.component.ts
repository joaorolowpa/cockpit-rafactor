import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChartModule } from 'primeng/chart';
import { ChartData, ChartOptions } from 'chart.js';

import { Company } from '../../../../models/companies.model';
import { CompaniesService } from '../../companies.service';
import { CompanyFinancialsService } from '../../company-financials.service';
import {
  ColmeiaHistorySummaryResponse,
  ColmeiaLatestResponse,
  CompanyColmeiaService
} from '../../company-colmeia.service';
import {
  CompanyDocument,
  CompanyExcelDocument,
  CompanyDocumentsService
} from '../../company-documents.service';
import {
  addDataType,
  flattenTimeSeriesData,
  groupDataBySeriesCode,
  prepareGrowthChartData,
  prepareMarginsChartData,
  prepareTableData,
  GroupedSeries,
  SectionData
} from '../../company-financials.utils';
import {
  ColmeiaCategory,
  ColmeiaHistoryRow,
  formatVariation,
  mapHistoryRows,
  mapLatestToCategories
} from '../../company-colmeia.utils';

type CompanyDetailTab = 'financials' | 'documents' | 'colmeia';

type CompanyDocumentRow = {
  id: number;
  type: 'Financial Models' | 'Cases & Other' | 'Investment Thesis';
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  date_reference?: string | null;
  filePath?: string | null;
};

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartModule],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss'
})
export class CompanyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly companiesService = inject(CompaniesService);
  private readonly documentsService = inject(CompanyDocumentsService);
  private readonly financialsService = inject(CompanyFinancialsService);
  private readonly colmeiaService = inject(CompanyColmeiaService);
  private readonly destroyRef = inject(DestroyRef);

  protected activeTab = signal<CompanyDetailTab>('financials');
  protected companyId = signal<number | null>(null);
  protected companyName = signal<string>('Company Details');

  protected companyLoading = signal<boolean>(true);
  protected companyError = signal<string | null>(null);

  protected documentsLoading = signal<boolean>(false);
  protected documentsError = signal<string | null>(null);
  protected documents = signal<CompanyDocument[]>([]);
  protected excels = signal<CompanyExcelDocument[]>([]);

  protected financialsLoading = signal<boolean>(false);
  protected financialsError = signal<string | null>(null);
  protected rawFinancials = signal<unknown[]>([]);
  protected growthFinancials = signal<unknown[]>([]);
  protected metricsFinancials = signal<unknown[]>([]);

  protected colmeiaLoading = signal<boolean>(false);
  protected colmeiaError = signal<string | null>(null);
  protected colmeiaLatest = signal<ColmeiaLatestResponse | null>(null);
  protected colmeiaHistory = signal<ColmeiaHistorySummaryResponse | null>(null);

  private financialsLoaded = false;
  private colmeiaLoaded = false;

  protected thesisDocuments = computed(() =>
    this.documents().filter((doc) => doc.document_type === 'THESIS')
  );

  protected otherDocuments = computed(() =>
    this.documents().filter((doc) => doc.document_type !== 'THESIS')
  );

  protected orderedDocuments = computed<CompanyDocumentRow[]>(() => {
    const excelRows = this.excels().map((excel) => ({
      id: excel.id,
      type: 'Financial Models' as const,
      created_at: excel.created_at,
      user_name: excel.user_name ?? null,
      user_email: excel.user_email ?? null,
      date_reference: excel.date_reference ?? null,
      filePath: excel.datalake_filepath ?? null
    }));

    const thesisRows = this.thesisDocuments().map((doc) => ({
      id: doc.id,
      type: 'Investment Thesis' as const,
      created_at: doc.created_at,
      user_name: doc.user_name ?? null,
      user_email: doc.user_email ?? null,
      date_reference: doc.date_reference ?? null,
      filePath: doc.file_path ?? null
    }));

    const otherRows = this.otherDocuments().map((doc) => ({
      id: doc.id,
      type: 'Cases & Other' as const,
      created_at: doc.created_at,
      user_name: doc.user_name ?? null,
      user_email: doc.user_email ?? null,
      date_reference: doc.date_reference ?? null,
      filePath: doc.file_path ?? null
    }));

    return [...excelRows, ...otherRows, ...thesisRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  protected groupedFinancials = computed<GroupedSeries[]>(() => {
    const raw = addDataType(flattenTimeSeriesData(this.rawFinancials() as any[]), 'financials');
    const growth = addDataType(flattenTimeSeriesData(this.growthFinancials() as any[]), 'growth');
    const metrics = addDataType(flattenTimeSeriesData(this.metricsFinancials() as any[]), 'metrics');
    return groupDataBySeriesCode([...raw, ...growth, ...metrics]);
  });

  protected financialSections = computed<SectionData[]>(() =>
    prepareTableData(this.groupedFinancials(), 'non-financials')
  );

  protected financialDateColumns = computed(() => {
    const dates = new Set<string>();
    this.groupedFinancials().forEach((series) => {
      series.values.forEach((value) => {
        if (value.date_reference) {
          dates.add(value.date_reference);
        }
      });
    });
    return Array.from(dates)
      .filter((date) => date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 8);
  });

  protected marginsChartData = computed<ChartData<'line'>>(() =>
    this.buildLineChartData(prepareMarginsChartData(this.groupedFinancials()))
  );

  protected growthChartData = computed<ChartData<'line'>>(() =>
    this.buildLineChartData(prepareGrowthChartData(this.groupedFinancials()))
  );

  protected lineChartOptions: ChartOptions<'line'>;

  protected colmeiaCategories = computed<ColmeiaCategory[]>(() =>
    mapLatestToCategories(this.colmeiaLatest())
  );

  protected colmeiaRadarData = computed<ChartData<'radar'>>(() =>
    this.buildRadarChartData(this.colmeiaCategories())
  );

  protected radarChartOptions: ChartOptions<'radar'>;

  protected colmeiaHistoryRows = computed<ColmeiaHistoryRow[]>(() => {
    const history = this.colmeiaHistory() as unknown;
    const items = Array.isArray(history)
      ? (history as any[])
      : (history as ColmeiaHistorySummaryResponse | null)?.items ?? [];
    return mapHistoryRows(items);
  });

  protected readonly formatVariation = formatVariation;
  private readonly themeColors = this.resolveThemeColors();
  protected showFinancialsExpanded = signal<boolean>(false);
  protected selectedFinancialRows = signal<Set<string>>(new Set());

  constructor() {
    this.lineChartOptions = this.buildLineChartOptions();
    this.radarChartOptions = this.buildRadarChartOptions();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idParam = params.get('id');
      const id = idParam ? Number(idParam) : null;
      if (!id || Number.isNaN(id)) {
        this.companyError.set('Invalid company id.');
        this.companyLoading.set(false);
        return;
      }

      this.companyId.set(id);
      this.financialsLoaded = false;
      this.colmeiaLoaded = false;
      this.rawFinancials.set([]);
      this.growthFinancials.set([]);
      this.metricsFinancials.set([]);
      this.colmeiaLatest.set(null);
      this.colmeiaHistory.set(null);
      this.loadCompany(id);
      this.loadDocuments(id);
      this.loadFinancials(id);
      this.loadColmeia(id);
    });
  }

  protected setTab(tab: CompanyDetailTab): void {
    this.activeTab.set(tab);
    const id = this.companyId();
    if (!id) return;
    if (tab === 'financials') {
      this.loadFinancials(id);
      this.loadColmeia(id);
    }
    if (tab === 'colmeia') {
      this.loadColmeia(id);
    }
  }

  protected formatCreatedAt(value?: string | null): string {
    if (!value) return '-';
    return formatDate(value, 'MMM d, y', 'en-US');
  }

  protected getFileName(path?: string | null): string {
    if (!path) return 'Unknown file';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Unknown file';
  }

  protected downloadDocument(filePath?: string | null): void {
    if (!filePath) return;

    const filename = this.getFileName(filePath);
    this.documentsService.downloadDocument(filePath).subscribe({
      next: (blob) => this.triggerDownload(blob, filename),
      error: (err) => {
        console.error('Failed to download document', err);
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected getReferenceDateLabel(row: CompanyDocumentRow): string {
    if (row.date_reference) {
      return row.date_reference;
    }

    const filename = this.getFileName(row.filePath);
    const match = filename.match(/date[_-]?ref=(\d{4}-\d{2}-\d{2})/i);
    return match ? match[1] : filename;
  }

  protected deleteCompanyDocument(row: CompanyDocumentRow): void {
    const companyId = this.companyId();
    if (!companyId) return;

    const confirmDelete = confirm(`Delete "${this.getFileName(row.filePath)}"?`);
    if (!confirmDelete) return;

    const request =
      row.type === 'Financial Models'
        ? this.documentsService.deleteCompanyExcel(row.id)
        : this.documentsService.deleteCompanyDocument(row.id);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadDocuments(companyId),
      error: (err: unknown) => {
        console.error('Failed to delete document:', err);
      }
    });
  }

  protected retryCompany(): void {
    const id = this.companyId();
    if (!id) return;
    this.loadCompany(id);
  }

  protected retryDocuments(): void {
    const id = this.companyId();
    if (!id) return;
    this.loadDocuments(id);
  }

  protected toggleFinancialsExpanded(): void {
    this.showFinancialsExpanded.set(!this.showFinancialsExpanded());
  }

  protected isFinancialRowSelected(seriesCode: string): boolean {
    return this.selectedFinancialRows().has(seriesCode);
  }

  protected toggleFinancialRowSelection(seriesCode: string): void {
    const next = new Set(this.selectedFinancialRows());
    if (next.has(seriesCode)) {
      next.delete(seriesCode);
    } else {
      next.add(seriesCode);
    }
    this.selectedFinancialRows.set(next);
  }

  protected copyFinancialTable(): void {
    const dates = this.financialDateColumns();
    const header = ['Series', 'Unit', ...dates].join('\t');
    const rows: string[] = [header];

    this.financialSections().forEach((section) => {
      if (!section.sectionData.length) return;
      const sectionLabelRow = [section.sectionLabel, ...Array(dates.length + 1).fill('')].join('\t');
      rows.push(sectionLabelRow);
      section.sectionData.forEach((row) => {
        const values = dates.map((date) => this.formatFinancialValue(this.getSeriesValue(row, date)));
        rows.push([row.description || row.series_code, row.unit || '-', ...values].join('\t'));
      });
    });

    navigator.clipboard.writeText(rows.join('\n'));
    alert('Table copied to clipboard');
  }

  protected copySelectedFinancialRows(): void {
    const selected = this.selectedFinancialRows();
    if (selected.size === 0) {
      alert('No rows selected');
      return;
    }

    const dates = this.financialDateColumns();
    const header = ['Series', 'Unit', ...dates].join('\t');
    const rows: string[] = [header];

    this.financialSections().forEach((section) => {
      const sectionRows = section.sectionData.filter((row) => selected.has(row.series_code));
      if (!sectionRows.length) return;
      const sectionLabelRow = [section.sectionLabel, ...Array(dates.length + 1).fill('')].join('\t');
      rows.push(sectionLabelRow);
      sectionRows.forEach((row) => {
        const values = dates.map((date) => this.formatFinancialValue(this.getSeriesValue(row, date)));
        rows.push([row.description || row.series_code, row.unit || '-', ...values].join('\t'));
      });
    });

    navigator.clipboard.writeText(rows.join('\n'));
    alert('Selected rows copied to clipboard');
  }

  protected formatFinancialValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    return String(value);
  }

  protected getSeriesValue(series: GroupedSeries, date: string): unknown {
    const value = series.values.find((item) => item.date_reference === date);
    return value?.value ?? null;
  }

  protected getScoreStyle(score: number): Record<string, string> {
    const normalized = Math.max(0, Math.min(5, score)) / 5;
    const hue = Math.round(normalized * 120);
    return {
      color: `hsl(${hue} 78% 32%)`,
      borderColor: `hsl(${hue} 62% 58%)`,
      backgroundColor: `hsl(${hue} 70% 96%)`
    };
  }

  private resolveThemeColors() {
    if (typeof document === 'undefined') {
      return {
        accent: '#b17840',
        accentStrong: '#9a6a33',
        text900: '#1f2937',
        text600: '#5b6570',
        border: '#e5e7eb'
      };
    }

    const styles = getComputedStyle(document.documentElement);
    return {
      accent: styles.getPropertyValue('--accent').trim() || '#b17840',
      accentStrong: styles.getPropertyValue('--accent-strong').trim() || '#9a6a33',
      text900: styles.getPropertyValue('--text-900').trim() || '#1f2937',
      text600: styles.getPropertyValue('--text-600').trim() || '#5b6570',
      border: styles.getPropertyValue('--border-200').trim() || '#e5e7eb'
    };
  }

  private toRgba(color: string, alpha: number): string {
    if (!color) return `rgba(0,0,0,${alpha})`;
    if (color.startsWith('rgba')) return color;
    if (color.startsWith('rgb')) {
      const values = color.replace(/[^\d,]/g, '').split(',').slice(0, 3).map((val) => val.trim());
      return `rgba(${values.join(',')}, ${alpha})`;
    }
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const parsed =
        hex.length === 3
          ? hex
              .split('')
              .map((char) => char + char)
              .join('')
          : hex;
      const bigint = parseInt(parsed, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  private buildLineChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: this.themeColors.text600
          }
        }
      },
      layout: {
        padding: {
          top: 6,
          right: 8,
          left: 4,
          bottom: 0
        }
      },
      scales: {
        y: {
          ticks: {
            color: this.themeColors.text600,
            maxTicksLimit: 6,
            padding: 6
          },
          grid: { color: this.themeColors.border }
        },
        x: {
          ticks: {
            color: this.themeColors.text600,
            autoSkip: true,
            maxTicksLimit: 8,
            minRotation: 0,
            maxRotation: 45,
            padding: 6
          },
          grid: { color: this.themeColors.border }
        }
      }
    };
  }

  private buildRadarChartOptions(): ChartOptions<'radar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1,
            color: this.themeColors.text600,
            backdropColor: 'transparent'
          },
          pointLabels: {
            color: this.themeColors.text600,
            font: { size: 11 }
          },
          grid: { color: this.themeColors.border },
          angleLines: { color: this.themeColors.border }
        }
      },
      plugins: {
        legend: { display: false }
      }
    };
  }

  private buildLineChartData(
    series: Array<{ label: string; data: Array<{ date_reference: string; value: unknown }> }>
  ): ChartData<'line'> {
    const dates = new Set<string>();
    series.forEach((item) =>
      item.data.forEach((entry) => {
        if (entry.date_reference) {
          dates.add(entry.date_reference);
        }
      })
    );

    const labels = Array.from(dates)
      .filter((label) => label)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const palette = [
      this.themeColors.accent,
      this.themeColors.accentStrong,
      this.themeColors.text600
    ];

    const datasets = series.map((item, index) => ({
      label: item.label,
      data: labels.map((label) => {
        const entry = item.data.find((value) => value.date_reference === label);
        const rawValue = entry?.value ?? null;
        const numeric = typeof rawValue === 'number' ? rawValue : Number(rawValue);
        return Number.isFinite(numeric) ? numeric : null;
      }),
      borderColor: palette[index % palette.length],
      backgroundColor: this.toRgba(palette[index % palette.length], 0.15),
      pointBackgroundColor: palette[index % palette.length],
      pointBorderColor: palette[index % palette.length],
      tension: 0.25,
      fill: false
    }));

    return { labels, datasets };
  }

  private buildRadarChartData(categories: ColmeiaCategory[]): ChartData<'radar'> {
    const accent = this.themeColors.accent;
    return {
      labels: categories.map((category) => category.label),
      datasets: [
        {
          label: 'Score',
          data: categories.map((category) => category.score),
          backgroundColor: this.toRgba(accent, 0.18),
          borderColor: accent,
          pointBackgroundColor: accent,
          pointBorderColor: accent
        }
      ]
    };
  }

  private loadCompany(companyId: number): void {
    this.companyLoading.set(true);
    this.companyError.set(null);

    this.companiesService
      .getCompanies({ companyIds: [companyId] })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (companies: Company[]) => {
          const company = companies.find((item) => item.id === companyId);
          this.companyName.set(company?.display_name || `Company #${companyId}`);
          this.companyLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading company:', err);
          this.companyError.set('Failed to load company details');
          this.companyLoading.set(false);
        }
      });
  }

  private loadDocuments(companyId: number): void {
    this.documentsLoading.set(true);
    this.documentsError.set(null);

    let hadError = false;

    forkJoin({
      documents: this.documentsService.getCompanyDocuments(companyId).pipe(
        catchError((err) => {
          console.error('Error loading documents:', err);
          hadError = true;
          return of([] as CompanyDocument[]);
        })
      ),
      excels: this.documentsService.getCompanyExcelDocuments(companyId).pipe(
        catchError((err) => {
          console.error('Error loading excel documents:', err);
          hadError = true;
          return of([] as CompanyExcelDocument[]);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ documents, excels }) => {
          this.documents.set(documents);
          this.excels.set(excels);
          if (hadError && documents.length === 0 && excels.length === 0) {
            this.documentsError.set('Failed to load documents.');
          } else {
            this.documentsError.set(null);
          }
          this.documentsLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading documents:', err);
          this.documentsError.set('Failed to load documents');
          this.documentsLoading.set(false);
        }
      });
  }

  private loadFinancials(companyId: number): void {
    if (this.financialsLoaded || this.financialsLoading()) return;

    this.financialsLoading.set(true);
    this.financialsError.set(null);

    let hadError = false;

    forkJoin({
      raw: this.financialsService.getCompanyFinancials(companyId, 'raw').pipe(
        catchError((err) => {
          console.error('Error loading raw financials:', err);
          hadError = true;
          return of([] as unknown[]);
        })
      ),
      growth: this.financialsService.getCompanyFinancials(companyId, 'growth').pipe(
        catchError((err) => {
          console.error('Error loading growth financials:', err);
          hadError = true;
          return of([] as unknown[]);
        })
      ),
      metrics: this.financialsService.getCompanyFinancials(companyId, 'metrics').pipe(
        catchError((err) => {
          console.error('Error loading metrics financials:', err);
          hadError = true;
          return of([] as unknown[]);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ raw, growth, metrics }) => {
          this.rawFinancials.set(raw);
          this.growthFinancials.set(growth);
          this.metricsFinancials.set(metrics);

          if (hadError && raw.length === 0 && growth.length === 0 && metrics.length === 0) {
            this.financialsError.set('Failed to load financials.');
          } else {
            this.financialsError.set(null);
          }

          this.financialsLoaded = !hadError;
          this.financialsLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading financials:', err);
          this.financialsError.set('Failed to load financials');
          this.financialsLoading.set(false);
        }
      });
  }

  private loadColmeia(companyId: number): void {
    if (this.colmeiaLoaded || this.colmeiaLoading()) return;

    this.colmeiaLoading.set(true);
    this.colmeiaError.set(null);

    let hadError = false;

    forkJoin({
      latest: this.colmeiaService.getLatest(companyId).pipe(
        catchError((err) => {
          console.error('Error loading latest colmeia:', err);
          hadError = true;
          return of(null);
        })
      ),
      history: this.colmeiaService.getHistorySummary(companyId).pipe(
        catchError((err) => {
          console.error('Error loading colmeia history:', err);
          hadError = true;
          return of({ items: [] } as ColmeiaHistorySummaryResponse);
        })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ latest, history }) => {
          this.colmeiaLatest.set(latest);
          this.colmeiaHistory.set(history);

          if (hadError && !latest && (history?.items?.length ?? 0) === 0) {
            this.colmeiaError.set('Failed to load colmeia.');
          } else {
            this.colmeiaError.set(null);
          }

          this.colmeiaLoaded = !hadError;
          this.colmeiaLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading colmeia:', err);
          this.colmeiaError.set('Failed to load colmeia');
          this.colmeiaLoading.set(false);
        }
      });
  }
}
