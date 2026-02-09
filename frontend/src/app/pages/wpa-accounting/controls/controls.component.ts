import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NavMissingEntry, WpaAccountingService } from '../wpa-accounting.service';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss'
})
export class ControlsComponent implements OnInit {
  private readonly wpaService = inject(WpaAccountingService);
  private readonly destroyRef = inject(DestroyRef);

  protected entries = signal<NavMissingEntry[]>([]);
  protected loading = signal<boolean>(true);
  protected error = signal<string | null>(null);

  protected readonly portfolioNames = computed(() => {
    const data = this.entries();
    if (!data.length) return [];
    const keys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== 'month') {
          keys.add(key);
        }
      });
    });
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  });

  protected readonly sortedEntries = computed(() => {
    const data = [...this.entries()];
    return data.sort((a, b) => {
      const aTime = new Date(a.month).getTime();
      const bTime = new Date(b.month).getTime();
      return aTime - bTime;
    });
  });

  ngOnInit(): void {
    this.loadEntries();
  }

  protected loadEntries(): void {
    this.loading.set(true);
    this.error.set(null);

    this.wpaService
      .getNavMissingEntries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries.set(entries ?? []);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error('Failed to load nav missing entries', err);
          this.error.set('Failed to load nav missing entries.');
          this.loading.set(false);
        }
      });
  }

  protected formatMonth(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'MMM y', 'en-US');
  }

  protected formatPortfolioName(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  protected isMissing(entry: NavMissingEntry, key: string): boolean {
    const value = entry[key];
    return value === 0 || value === '0';
  }

  protected formatCell(entry: NavMissingEntry, key: string): string {
    const value = entry[key];
    if (value === null || value === undefined) return '-';
    if (value === 1 || value === '1') return 'OK';
    if (value === 0 || value === '0') return 'X';
    return String(value);
  }

  protected trackByMonth(_index: number, entry: NavMissingEntry): string {
    return entry.month;
  }

  protected trackByPortfolio(_index: number, key: string): string {
    return key;
  }
}
