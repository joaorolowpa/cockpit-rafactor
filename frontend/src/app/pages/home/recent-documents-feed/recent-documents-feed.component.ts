import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecentDocumentsService, RecentDocument } from './recent-documents.service';
import { ButtonModule } from 'primeng/button';

interface GroupedDocuments {
  date: string;
  displayDate: string;
  documents: RecentDocument[];
}

@Component({
  selector: 'app-recent-documents-feed',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './recent-documents-feed.component.html',
  styleUrl: './recent-documents-feed.component.scss'
})
export class RecentDocumentsFeedComponent {
  private readonly service = inject(RecentDocumentsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly allDocuments = signal<RecentDocument[]>([]);
  protected readonly displayLimit = signal<number>(10);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly displayedDocuments = computed(() =>
    this.allDocuments().slice(0, this.displayLimit())
  );

  protected readonly groupedDocuments = computed<GroupedDocuments[]>(() => {
    const map = new Map<string, RecentDocument[]>();

    this.displayedDocuments().forEach((doc) => {
      const rawDate = doc.date_reference || doc.created_at;
      const parsed = rawDate ? new Date(rawDate) : new Date();
      const key = formatDate(parsed, 'yyyy-MM-dd', 'en-US');

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(doc);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, documents]) => ({
        date,
        displayDate: this.formatWithOrdinal(new Date(date)),
        documents
      }));
  });

  protected readonly hasMore = computed(
    () => this.displayLimit() < this.allDocuments().length
  );

  constructor() {
    this.loadDocuments();
  }

  protected loadDocuments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.service
      .getRecentDocuments(1000, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (docs) => {
          this.allDocuments.set(docs);
          this.displayLimit.set(10);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error loading recent documents');
          this.isLoading.set(false);
        }
      });
  }

  protected loadMore(): void {
    this.displayLimit.set(this.displayLimit() + 10);
  }

  protected downloadDocument(doc: RecentDocument): void {
    const filePath = doc.file_path;
    if (!filePath) return;

    this.service.downloadDocument(filePath, 1).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getDownloadFileName(doc);
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage.set('Failed to download document');
      }
    });
  }

  private getDownloadFileName(doc: RecentDocument): string {
    const fallback = `document-${doc.id || 'file'}`;
    const path = doc.file_path || '';
    const name = path.split('/').pop()?.trim();
    return name && name.length > 0 ? name : fallback;
  }

  protected formatCreatedAt(value?: string | null): string {
    if (!value) return '-';
    return formatDate(new Date(value), 'MMM d, y', 'en-US');
  }

  private formatWithOrdinal(value: Date): string {
    const day = value.getDate();
    const suffix = this.getOrdinalSuffix(day);
    const month = formatDate(value, 'MMMM', 'en-US');
    const year = formatDate(value, 'y', 'en-US');
    return `${month} ${day}${suffix}, ${year}`;
  }

  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
}
