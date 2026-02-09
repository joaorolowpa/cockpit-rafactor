import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AssetClassifications, BackofficeAssetsService } from './assets.service';

type AssetsTabKey = 'classes' | 'geography' | 'gestao' | 'internal' | 'onoff' | 'pubxpvt' | 'tema';

interface AssetsTabConfig {
  key: AssetsTabKey;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-backoffice-assets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assets.component.html',
  styleUrl: './assets.component.scss'
})
export class BackofficeAssetsComponent implements OnInit {
  private readonly assetsService = inject(BackofficeAssetsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs: AssetsTabConfig[] = [
    { key: 'classes', label: 'Classes', icon: 'fa-solid fa-briefcase' },
    { key: 'geography', label: 'Geography', icon: 'fa-solid fa-globe' },
    { key: 'gestao', label: 'Gestão', icon: 'fa-solid fa-gear' },
    { key: 'internal', label: 'Internal', icon: 'fa-solid fa-shield-halved', disabled: true },
    { key: 'onoff', label: 'Onshore / Offshore', icon: 'fa-solid fa-link' },
    { key: 'pubxpvt', label: 'Public X Private', icon: 'fa-solid fa-users' },
    { key: 'tema', label: 'Tema', icon: 'fa-solid fa-tag' }
  ];

  protected readonly activeTab = signal<AssetsTabKey>('classes');
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchTerm = signal<string>('');
  protected readonly selectedLote45 = signal<string>('');
  protected readonly selectedMilestones = signal<string>('');
  protected readonly showUnclassified = signal<boolean>(false);

  private readonly emptyData: AssetClassifications = { columns: [], data: [] };
  protected readonly classificationsByTab = signal<Record<AssetsTabKey, AssetClassifications>>({
    classes: this.emptyData,
    geography: this.emptyData,
    gestao: this.emptyData,
    internal: this.emptyData,
    onoff: this.emptyData,
    pubxpvt: this.emptyData,
    tema: this.emptyData
  });

  protected readonly activeData = computed(() => this.classificationsByTab()[this.activeTab()] ?? this.emptyData);

  protected readonly columnKeys = computed(() => this.activeData().columns ?? []);

  protected readonly rows = computed(() => this.buildRows(this.activeData()));

  protected readonly rowsWithNoClassification = computed(() => {
    if (!this.hasColumn('classification_id')) return [];
    return this.rows().filter((row) => row['classification_id'] === null || row['classification_id'] === undefined);
  });

  protected readonly assetIdsWithNoClassification = computed(() => {
    const ids = this.rowsWithNoClassification()
      .map((row) => row['asset_id'])
      .filter((id) => id !== null && id !== undefined);
    return ids.map((id) => String(id));
  });

  protected readonly lote45Options = computed(() =>
    this.getUniqueColumnValues('lote45_asset_type')
  );

  protected readonly milestonesOptions = computed(() =>
    this.getUniqueColumnValues('milestones_asset_type')
  );

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const selectedLote45 = this.selectedLote45();
    const selectedMilestones = this.selectedMilestones();

    let data = this.showUnclassified() ? this.rowsWithNoClassification() : this.rows();

    if (term) {
      data = data.filter((row) => {
        const value = row['display_name'] ?? row['name'] ?? row['asset_name'] ?? '';
        return String(value).toLowerCase().includes(term);
      });
    }

    if (selectedLote45) {
      data = data.filter((row) => row['lote45_asset_type'] === selectedLote45);
    }

    if (selectedMilestones) {
      data = data.filter((row) => row['milestones_asset_type'] === selectedMilestones);
    }

    return data;
  });

  ngOnInit(): void {
    this.loadClassifications();
  }

  protected setTab(tab: AssetsTabKey): void {
    const config = this.tabs.find((item) => item.key === tab);
    if (config?.disabled) return;
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.selectedLote45.set('');
    this.selectedMilestones.set('');
    this.showUnclassified.set(false);
  }

  protected loadClassifications(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      classes: this.assetsService.getClassifications('classe').pipe(catchError(() => of(this.emptyData))),
      geography: this.assetsService.getClassifications('geography').pipe(catchError(() => of(this.emptyData))),
      gestao: this.assetsService.getClassifications('gestao').pipe(catchError(() => of(this.emptyData))),
      internal: this.assetsService.getClassifications('internal').pipe(catchError(() => of(this.emptyData))),
      onoff: this.assetsService.getClassifications('onoff').pipe(catchError(() => of(this.emptyData))),
      pubxpvt: this.assetsService.getClassifications('pubxpvt').pipe(catchError(() => of(this.emptyData))),
      tema: this.assetsService.getClassifications('tema').pipe(catchError(() => of(this.emptyData)))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.classificationsByTab.set({
            classes: result.classes ?? this.emptyData,
            geography: result.geography ?? this.emptyData,
            gestao: result.gestao ?? this.emptyData,
            internal: result.internal ?? this.emptyData,
            onoff: result.onoff ?? this.emptyData,
            pubxpvt: result.pubxpvt ?? this.emptyData,
            tema: result.tema ?? this.emptyData
          });
          this.loading.set(false);
          const hasAny =
            result.classes.data.length ||
            result.geography.data.length ||
            result.gestao.data.length ||
            result.onoff.data.length ||
            result.pubxpvt.data.length ||
            result.tema.data.length ||
            result.internal.data.length;
          if (!hasAny) {
            this.error.set('No classifications available.');
          }
        },
        error: (err: unknown) => {
          console.error('Failed to load classifications', err);
          this.error.set('Failed to load classifications.');
          this.loading.set(false);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedLote45.set('');
    this.selectedMilestones.set('');
  }

  protected hasColumn(column: string): boolean {
    return this.columnKeys().includes(column);
  }

  protected formatHeader(column: string): string {
    return column
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected formatCell(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  protected trackByRow(index: number, row: Record<string, unknown>): string | number {
    return (row['asset_id'] as number | string | undefined) ?? index;
  }

  protected trackByColumn(_index: number, column: string): string {
    return column;
  }

  protected trackByTab(_index: number, tab: AssetsTabConfig): string {
    return tab.key;
  }

  private buildRows(data: AssetClassifications): Array<Record<string, unknown>> {
    if (!data || !data.columns?.length) return [];
    return data.data.map((row) => {
      const obj: Record<string, unknown> = {};
      data.columns.forEach((column, index) => {
        obj[column] = row[index];
      });
      return obj;
    });
  }

  private getUniqueColumnValues(column: string): string[] {
    if (!this.hasColumn(column)) return [];
    const values = new Set<string>();
    this.rows().forEach((row) => {
      const value = row[column];
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value));
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }
}
