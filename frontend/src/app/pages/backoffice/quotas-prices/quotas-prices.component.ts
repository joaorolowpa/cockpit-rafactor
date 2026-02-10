import { CommonModule, formatDate as formatDateFn } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BackofficeQuotasPricesService, QuotaPrice } from './quotas-prices.service';
import { UI_IMPORTS } from '../../../ui/ui.imports';

interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
  isValid: boolean;
  error?: string;
}

interface CellStyle {
  isMissing: boolean;
  isFirstNonNull: boolean;
}

type TransformedRow = {
  date_reference: string;
  _cellStyles: Record<string, CellStyle>;
  [key: string]: string | number | null | Record<string, CellStyle>;
};

@Component({
  selector: 'app-backoffice-quotas-prices',
  standalone: true,
  imports: [CommonModule, ...UI_IMPORTS],
  templateUrl: './quotas-prices.component.html',
  styleUrl: './quotas-prices.component.scss'
})
export class BackofficeQuotasPricesComponent implements OnInit {
  private readonly quotasService = inject(BackofficeQuotasPricesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isProcessing = signal<boolean>(false);
  protected readonly uploadedFiles = signal<UploadFile[]>([]);
  protected readonly isDragging = signal<boolean>(false);
  protected readonly uploadStatus = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly columns = signal<string[]>([]);
  protected readonly rows = signal<TransformedRow[]>([]);

  protected readonly hasInvalidFiles = computed(() =>
    this.uploadedFiles().some((file) => !file.isValid)
  );

  protected readonly canUpload = computed(() =>
    !this.isProcessing() && this.uploadedFiles().length > 0 && !this.hasInvalidFiles()
  );

  ngOnInit(): void {
    this.loadQuotaPrices();
  }

  protected loadQuotaPrices(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.quotasService
      .getQuotaPrices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const transformed = this.transformQuotaPrices(data ?? []);
          this.columns.set(transformed.columns);
          this.rows.set(transformed.rows);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load quota prices', err);
          this.error.set('Failed to load quota prices.');
          this.isLoading.set(false);
        }
      });
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.handleFiles(input.files);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (!event.dataTransfer?.files) return;
    this.handleFiles(event.dataTransfer.files);
  }

  private handleFiles(fileList: FileList): void {
    const incoming = Array.from(fileList).slice(0, 1);
    const processed = incoming.map((file) => this.validateFile(file));
    this.uploadedFiles.set(processed);
    this.uploadStatus.set(null);
  }

  private validateFile(file: File): UploadFile {
    const acceptedExtensions = ['xlsx', 'xls'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const acceptedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    const isValid =
      (!!extension && acceptedExtensions.includes(extension)) ||
      (!!file.type && acceptedMimeTypes.includes(file.type));

    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isValid,
      error: isValid ? undefined : 'Only .xlsx or .xls files are allowed.'
    };
  }

  protected removeFile(): void {
    this.uploadedFiles.set([]);
  }

  protected handleUpload(): void {
    if (!this.canUpload()) return;
    const file = this.uploadedFiles()[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file.file);

    this.isProcessing.set(true);
    this.uploadStatus.set(null);

    this.quotasService
      .uploadQuotaPrices(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.uploadedFiles.set([]);
          this.uploadStatus.set({ type: 'success', message: 'Upload completed successfully.' });
          this.loadQuotaPrices();
        },
        error: (err: unknown) => {
          console.error('Upload failed', err);
          this.isProcessing.set(false);
          this.uploadStatus.set({ type: 'error', message: 'Upload failed. Please try again.' });
        }
      });
  }

  protected formatDateReference(value: unknown): string {
    if (!value) return '-';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return formatDateFn(date, 'yyyy-MM-dd', 'en-US');
  }

  protected formatNumber(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toFixed(8);
    return String(value);
  }

  protected getCellStyle(row: TransformedRow, column: string): CellStyle {
    const styles = row['_cellStyles'] as Record<string, CellStyle> | undefined;
    return styles?.[column] ?? { isMissing: false, isFirstNonNull: false };
  }

  protected copyTable(): void {
    const columns = this.columns();
    const rows = this.rows();
    if (!columns.length || !rows.length) return;

    const headerRow = columns.join('\t');
    const dataRows = rows.map((row) =>
      columns
        .map((col) => {
          const value = row[col];
          if (value === null || value === undefined || typeof value === 'object') return '';
          if (col !== 'date_reference' && typeof value === 'number') return value.toFixed(8);
          return String(value);
        })
        .join('\t')
    );

    const content = [headerRow, ...dataRows].join('\n');
    navigator.clipboard.writeText(content).catch((error) => {
      console.error('Failed to copy table:', error);
    });
  }

  protected exportCsv(locale: 'USA' | 'BR'): void {
    const columns = this.columns();
    const rows = this.rows();
    if (!columns.length || !rows.length) return;

    const separator = locale === 'BR' ? ';' : ',';
    const headerRow = columns.join(separator);
    const dataRows = rows.map((row) =>
      columns
        .map((col) => {
          const value = row[col];
          if (value === null || value === undefined || typeof value === 'object') return '';
          if (col !== 'date_reference' && typeof value === 'number') {
            return locale === 'BR'
              ? value.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
              : value.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
          }
          return String(value);
        })
        .join(separator)
    );

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quota_prices_${locale.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected trackByColumn(_index: number, column: string): string {
    return column;
  }

  protected trackByRow(index: number, _row: TransformedRow): number {
    return index;
  }

  private transformQuotaPrices(data: QuotaPrice[]) {
    if (!Array.isArray(data) || data.length === 0) {
      return { columns: ['date_reference'], rows: [] as TransformedRow[] };
    }

    const assetNamesSet = new Set<string>();
    const dateToRowMap = new Map<string, TransformedRow>();

    data.forEach((item) => {
      if (item.milestones_name) assetNamesSet.add(item.milestones_name);
      if (!dateToRowMap.has(item.date_reference)) {
        dateToRowMap.set(item.date_reference, {
          date_reference: item.date_reference,
          _cellStyles: {}
        });
      }
    });

    const assetNames = Array.from(assetNamesSet).sort((a, b) => a.localeCompare(b));

    dateToRowMap.forEach((row) => {
      assetNames.forEach((name) => {
        if (!(name in row)) row[name] = null;
        (row['_cellStyles'] as Record<string, CellStyle>)[name] = {
          isMissing: false,
          isFirstNonNull: false
        };
      });
    });

    const firstNonNullFound = new Set<string>();
    data.forEach((item) => {
      const row = dateToRowMap.get(item.date_reference);
      if (!row) return;
      const value = typeof item.price_quota === 'number' ? item.price_quota : null;
      row[item.milestones_name] = value;
      if (value !== null && !firstNonNullFound.has(item.milestones_name)) {
        firstNonNullFound.add(item.milestones_name);
        (row['_cellStyles'] as Record<string, CellStyle>)[item.milestones_name].isFirstNonNull = true;
      }
    });

    dateToRowMap.forEach((row) => {
      assetNames.forEach((name) => {
        if (row[name] === null) {
          (row['_cellStyles'] as Record<string, CellStyle>)[name].isMissing = true;
        }
      });
    });

    const rows = Array.from(dateToRowMap.values()).sort((a, b) =>
      String(a['date_reference']).localeCompare(String(b['date_reference']))
    );

    return { columns: ['date_reference', ...assetNames], rows };
  }
}
