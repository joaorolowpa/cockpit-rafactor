import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Fund, FundManagerDetails, FundManagerDocument, FundNote, GroupedFund, Metrics, Relationship, RelationshipDetails, RelationshipWithMetrics } from '../../../../models/funds.model';
import { FundsService } from '../../funds.service';
import { FundsAccordionComponent } from '../../overview/funds-list.component';
import { FundManagerEditDialogComponent } from './fund-manager-edit-dialog/fund-manager-edit-dialog.component';

type FundManagerTab = 'home' | 'relationships' | 'documents';

@Component({
  selector: 'app-fund-manager-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ChartModule, RouterLink, FundsAccordionComponent, FundManagerEditDialogComponent],
  templateUrl: './fund-manager-detail.component.html',
  styleUrl: './fund-manager-detail.component.scss'
})
export class FundManagerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fundsService = inject(FundsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  protected isLoading = signal<boolean>(true);
  protected error = signal<string | null>(null);
  protected fund = signal<Fund | null>(null);
  protected fundDetails = signal<FundManagerDetails | null>(null);
  protected notes = signal<FundNote[]>([]);
  protected documents = signal<FundManagerDocument[]>([]);
  protected relationships = signal<Relationship[]>([]);
  protected metrics = signal<Metrics[]>([]);
  protected relationshipsError = signal<boolean>(false);
  protected documentsError = signal<boolean>(false);
  protected notesError = signal<boolean>(false);
  protected relationshipDetails = signal<RelationshipDetails | null>(null);
  protected relationshipDetailsError = signal<boolean>(false);
  protected selectedRelationshipId = signal<number | null>(null);
  protected readonly relationshipId$ = toObservable(this.selectedRelationshipId);
  protected activeTab = signal<FundManagerTab>('home');
  protected showEditDialog = signal<boolean>(false);
  protected fundManagerId = signal<number | null>(null);
  protected readonly relationshipSeries = [
    { key: 'METRICS_DPI', label: 'DPI (Distributed / Capital Calls)' },
    { key: 'METRICS_DPI_ADJ', label: 'DPI EX Equalization' },
    { key: 'METRICS_RVPI', label: 'RVPI (NAV / Capital Calls)' },
    { key: 'METRICS_TVPI', label: 'TVPI ((Distributed + NAV) / Capital calls)' },
    { key: 'RATIO_OUTSTANDING_COMMITMENTS_PERCENT', label: 'Remaining Callable (%)' }
  ];

  protected readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number } }) => `${(context.parsed.y ?? 0).toFixed(2)}%`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: number) => `${value}%`
        }
      }
    }
  };

  protected groupedRelationships = computed<GroupedFund[]>(() => {
    const fund = this.fund();
    if (!fund) return [];

    const metricsMap = new Map<number, Metrics>(
      this.metrics().map((metric) => [metric.relationship_id, metric])
    );

    const relationshipsWithMetrics: RelationshipWithMetrics[] = this.relationships()
      .map((relationship) => ({
        ...relationship,
        relationship_metrics: metricsMap.get(Number(relationship.id))
      }))
      .filter((relationship) => relationship.relationship_metrics);

    return [{
      fundName: fund.display_name,
      relationships: relationshipsWithMetrics
    }];
  });

  protected selectedRelationshipGroup = computed<GroupedFund[]>(() => {
    const fund = this.fund();
    const selected = this.selectedRelationship();
    const metric = this.selectedMetrics();
    if (!fund || !selected || !metric) return [];

    return [{
      fundName: fund.display_name,
      relationships: [{
        ...selected,
        relationship_metrics: metric
      }]
    }];
  });

  protected getChartData(seriesKey: string): { labels: string[]; datasets: Array<{ label: string; data: number[]; borderColor: string; tension: number; pointRadius: number }> } | null {
    const metrics = this.selectedMetrics();
    if (!metrics?.timeseries?.columns?.length || !metrics?.timeseries?.data?.length) {
      return { labels: [], datasets: [] };
    }

    const dateColumnIndex = metrics.timeseries.columns.findIndex(col =>
      col && col.toLowerCase().includes('date')
    );
    const seriesColumnIndex = metrics.timeseries.columns.findIndex(col => col === seriesKey);

    if (dateColumnIndex === -1 || seriesColumnIndex === -1) {
      return { labels: [], datasets: [] };
    }

    const labels = metrics.timeseries.data.map(row => String(row[dateColumnIndex]));
    const data = metrics.timeseries.data.map(row => {
      const value = Number(row[seriesColumnIndex]);
      return Number.isFinite(value) ? value * 100 : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: seriesKey,
          data,
          borderColor: '#B17840',
          tension: 0.3,
          pointRadius: 0
        }
      ]
    };
  }

  protected availableRelationships = computed(() => {
    const metricIds = new Set(this.metrics().map((metric) => metric.relationship_id));
    return this.relationships().filter((relationship) => metricIds.has(Number(relationship.id)));
  });

  protected relationshipOptions = computed(() =>
    this.availableRelationships().map((relationship) => ({
      label: relationship.asset_display_name,
      value: Number(relationship.id)
    }))
  );

  protected selectedRelationship = computed(() => {
    const id = this.selectedRelationshipId();
    if (!id) return null;
    return this.availableRelationships().find((relationship) => Number(relationship.id) === id) ?? null;
  });

  protected selectedMetrics = computed(() => {
    const id = this.selectedRelationshipId();
    if (!id) return null;
    return this.metrics().find((metric) => metric.relationship_id === id) ?? null;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      distinctUntilChanged(),
      switchMap((id) => {
        if (!Number.isFinite(id)) {
          this.error.set('Invalid fund manager id');
          this.isLoading.set(false);
          return of({
            fund: null,
            relationships: [] as Relationship[],
            metrics: [] as Metrics[],
            details: null,
            notes: [] as FundNote[],
            documents: [] as FundManagerDocument[],
            id
          });
        }

        this.isLoading.set(true);
        this.error.set(null);
        this.relationshipsError.set(false);
        this.documentsError.set(false);
        this.notesError.set(false);

        const fund$ = this.fundsService.getFundManagers().pipe(
          map((funds) => funds.find((f) => f.id === id) ?? null),
          catchError(() => {
            this.error.set('Failed to load fund manager');
            return of(null);
          })
        );

        const relationships$ = this.fundsService.getRelationships([id]).pipe(
          catchError(() => {
            this.relationshipsError.set(true);
            return of([] as Relationship[]);
          })
        );

        const metrics$ = this.fundsService.getMetrics([id]).pipe(
          catchError(() => of([] as Metrics[]))
        );

        const details$ = this.fundsService.getFundManagerDetails(id).pipe(
          catchError(() => of(null))
        );

        const notes$ = this.fundsService.getFundsNotes([id]).pipe(
          catchError(() => {
            this.notesError.set(true);
            return of([] as FundNote[]);
          })
        );

        const documents$ = this.fundsService.getFundsManagersDocuments(id).pipe(
          catchError(() => {
            this.documentsError.set(true);
            return of([] as FundManagerDocument[]);
          })
        );

        return forkJoin({
          fund: fund$,
          relationships: relationships$,
          metrics: metrics$,
          details: details$,
          notes: notes$,
          documents: documents$,
          id: of(id)
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ fund, relationships, metrics, details, notes, documents, id }) => {
      this.fundManagerId.set(id);
      this.fund.set(fund);
      this.relationships.set(relationships);
      this.metrics.set(metrics);
      this.fundDetails.set(details);
      this.notes.set(notes);
      this.documents.set(documents);

      if (!fund && !this.error()) {
        this.error.set(`Fund manager ${id} not found`);
      }

      const available = this.availableRelationships();
      const current = this.selectedRelationshipId();
      if (!current || !available.some((relationship) => Number(relationship.id) === current)) {
        this.selectedRelationshipId.set(available[0] ? Number(available[0].id) : null);
      }

      this.isLoading.set(false);
    });

    this.relationshipId$.pipe(
      filter((id): id is number => Number.isFinite(id)),
      distinctUntilChanged(),
      switchMap((relationshipId) => {
        this.relationshipDetails.set(null);
        this.relationshipDetailsError.set(false);
        console.log("getFundRelationshipDetails", relationshipId);
        return this.fundsService.getFundRelationshipDetails(relationshipId).pipe(
          catchError(() => {
            this.relationshipDetailsError.set(true);
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((details) => {
      console.log("getFundRelationshipDetails result", details);
      this.relationshipDetails.set(details);
    });
  }

  protected openEditDialog(): void {
    this.showEditDialog.set(true);
  }

  protected closeEditDialog(): void {
    this.showEditDialog.set(false);
  }

  protected onDetailsUpdated(details: FundManagerDetails): void {
    this.fundDetails.set(details);
    this.showEditDialog.set(false);
  }

  protected setTab(tab: FundManagerTab): void {
    this.activeTab.set(tab);
  }

  protected sanitizeHtml(value?: string | null): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value ?? '');
  }

  protected mapDocumentType(value: string): string {
    const map: Record<string, string> = {
      PPM: 'PPM',
      LPA: 'LPA',
      DDQ: 'DDQ',
      PRESENTATION: 'Presentation',
      LETTER: 'Letter',
      FUND_UPDATE: 'Fund Update',
      FINANCIAL_STATEMENT: 'Financial Statement'
    };

    return map[value] || value;
  }
}
