import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { API_BASE_URL, API_KEY } from '../../../config/api.config';

type FileTabKey = 'all' | 'funds' | 'historical' | 'historicalBook' | 'productClass';

interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
  isValid: boolean;
  error?: string;
}

interface FileTabConfig {
  key: FileTabKey;
  label: string;
  icon: string;
  endpoint?: string;
  nameHint?: string;
  nameRegex?: RegExp;
  allowUpload: boolean;
}

@Component({
  selector: 'app-backoffice-files',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './files.component.html',
  styleUrl: './files.component.scss'
})
export class BackofficeFilesComponent {
  private readonly http = inject(HttpClient);

  protected readonly activeTab = signal<FileTabKey>('all');
  protected readonly uploadedFiles = signal<UploadFile[]>([]);
  protected readonly isProcessing = signal<boolean>(false);
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly statusType = signal<'success' | 'error' | null>(null);
  protected readonly isDragging = signal<boolean>(false);

  protected readonly tabs: FileTabConfig[] = [
    {
      key: 'all',
      label: 'All Trading Desks Overview',
      icon: 'fa-solid fa-layer-group',
      endpoint: '/v1/portfolios/lote45/load-overview/consolidated',
      nameHint: 'Name prefix: AllTradingDesksOverView',
      allowUpload: true
    },
    {
      key: 'funds',
      label: 'Funds Trades',
      icon: 'fa-solid fa-chart-column',
      endpoint: '/v1/portfolios/lote45/funds-trades',
      nameHint: 'Pattern: FundsTrades-YYYYMMDD-YYYYMMDD.(txt|csv)',
      nameRegex: /^FundsTrades-\d{8}-\d{8}\.(txt|csv)$/,
      allowUpload: true
    },
    {
      key: 'historical',
      label: 'Historical Funds NAV and Share',
      icon: 'fa-solid fa-clock-rotate-left',
      endpoint: '/v1/portfolios/lote45/historical-funds-nav',
      nameHint: 'Pattern: HistoricalFundsNAVAndShare-ddMmmYYYY-ddMmmYYYY.(txt|csv)',
      nameRegex: /^HistoricalFundsNAVAndShare-\d{2}[A-Z]{1}[a-z]{2}\d{4}-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/,
      allowUpload: true
    },
    {
      key: 'historicalBook',
      label: 'Historical Book Performance',
      icon: 'fa-solid fa-book',
      endpoint: '/v1/portfolios/lote45/historical-book-performance',
      nameHint: 'Pattern: HistoricalBookPerformance-ddMmmYYYY-ddMmmYYYY.(txt|csv)',
      nameRegex: /^HistoricalBookPerformance-\d{2}[A-Z]{1}[a-z]{2}\d{4}-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/,
      allowUpload: true
    },
    {
      key: 'productClass',
      label: 'Product Class Products Info',
      icon: 'fa-solid fa-circle-info',
      endpoint: '/v1/portfolios/lote45/product-class-info',
      nameHint: 'Pattern: ProductClassProductsInfo-ddMmmYYYY.(txt|csv)',
      nameRegex: /^ProductClassProductsInfo-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/,
      allowUpload: true
    },
  ];

  protected readonly activeTabConfig = computed(() =>
    this.tabs.find((tab) => tab.key === this.activeTab())
  );

  protected readonly hasInvalidFiles = computed(() =>
    this.uploadedFiles().some((file) => !file.isValid)
  );

  protected readonly canUpload = computed(() => {
    const config = this.activeTabConfig();
    if (!config?.allowUpload) return false;
    if (this.isProcessing()) return false;
    if (this.uploadedFiles().length === 0) return false;
    if (this.hasInvalidFiles()) return false;
    return true;
  });

  protected setTab(key: FileTabKey): void {
    if (this.activeTab() === key) return;
    this.activeTab.set(key);
    this.uploadedFiles.set([]);
    this.statusMessage.set(null);
    this.statusType.set(null);
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
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
    const config = this.activeTabConfig();
    if (!config?.allowUpload) return;

    const existing = this.uploadedFiles();
    const maxFiles = 10;
    const availableSlots = Math.max(maxFiles - existing.length, 0);
    const incoming = Array.from(fileList).slice(0, availableSlots);

    const processed = incoming.map((file) => this.validateFile(file, config));
    this.uploadedFiles.set([...existing, ...processed]);
  }

  private validateFile(file: File, config: FileTabConfig): UploadFile {
    if (!config.nameRegex) {
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isValid: true
      };
    }

    const isValid = config.nameRegex.test(file.name);
    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isValid,
      error: isValid ? undefined : 'Filename does not match expected pattern.'
    };
  }

  protected removeFile(index: number): void {
    const current = [...this.uploadedFiles()];
    current.splice(index, 1);
    this.uploadedFiles.set(current);
  }

  protected async handleUpload(): Promise<void> {
    const config = this.activeTabConfig();
    if (!config?.allowUpload || !config.endpoint) return;
    if (!this.canUpload()) return;

    this.isProcessing.set(true);
    this.statusMessage.set(null);
    this.statusType.set(null);

    const formData = new FormData();
    this.uploadedFiles().forEach((file) => {
      formData.append('files', file.file);
    });

    const headers = new HttpHeaders({
      'api-key': API_KEY,
      'x-api-key': API_KEY
    });

    this.http.post(`${API_BASE_URL}${config.endpoint}`, formData, { headers }).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.uploadedFiles.set([]);
        this.statusMessage.set('Upload completed successfully.');
        this.statusType.set('success');
      },
      error: (error) => {
        console.error('Upload failed', error);
        this.isProcessing.set(false);
        this.statusMessage.set('Upload failed. Please try again.');
        this.statusType.set('error');
      }
    });
  }

  protected formatFileSize(bytes: number): string {
    if (!bytes && bytes !== 0) return '-';
    const kb = 1024;
    const mb = kb * 1024;
    if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
    return `${(bytes / kb).toFixed(1)} KB`;
  }

  protected trackByTab(_index: number, tab: FileTabConfig): string {
    return tab.key;
  }

  protected trackByFile(_index: number, file: UploadFile): string {
    return file.name;
  }
}
