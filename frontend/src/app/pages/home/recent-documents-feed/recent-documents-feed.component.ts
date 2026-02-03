import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecentDocumentsService, RecentDocument } from './recent-documents.service';

interface GroupedDocuments {
  date: string;
  displayDate: string;
  documents: RecentDocument[];
}

@Component({
  selector: 'app-recent-documents-feed',
  standalone: true,
  imports: [CommonModule],
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
        displayDate: formatDate(new Date(date), 'PPP', 'en-US'),
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
}
