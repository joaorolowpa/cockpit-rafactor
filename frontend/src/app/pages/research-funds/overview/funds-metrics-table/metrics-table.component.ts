import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Metrics, DISPLAY_SERIES, SERIES_CONFIG } from '../../../../models/funds.model';

interface SeriesRow {
  seriesName: string;
  originalCode: string;
  values: { [date: string]: string | number };
  type: 'percent' | 'value';
}

@Component({
  selector: 'app-metrics-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metrics-table.component.html',
  styleUrl: './metrics-table.component.scss'
})
export class MetricsTableComponent {
  metrics = input.required<Metrics>();
  relationshipName = input<string>('');

  protected showExpandedView = signal<boolean>(false);
  protected selectedRows = signal<Set<string>>(new Set());
  protected isAccumulated = signal<boolean>(false);

  protected tableData = computed(() => {
    const m = this.metrics();
    
    if (!m?.timeseries?.columns?.length || !m?.timeseries?.data?.length) {
      console.warn('No data available');
      return { headers: [], rows: [], dateColumns: [] };
    }

    // Encontra o índice da coluna de data
    const dateColumnIndex = m.timeseries.columns.findIndex(col => 
      col && col.toLowerCase().includes('date')
    );

    if (dateColumnIndex === -1) {
      console.error('Date column not found');
      return { headers: [], rows: [], dateColumns: [] };
    }

    // Extrai as datas
    const dates = m.timeseries.data.map(row => String(row[dateColumnIndex]));

    // Filtra apenas as colunas que estão em DISPLAY_SERIES
    const seriesColumns = m.timeseries.columns
      .map((col, index) => ({ col, index }))
      .filter(({ col, index }) => 
        index !== dateColumnIndex && DISPLAY_SERIES.includes(col)
      );

    console.log('Filtered series columns:', seriesColumns.map(s => s.col));

    // Constrói as rows (apenas as séries filtradas)
    const rows: SeriesRow[] = seriesColumns.map(({ col: seriesCode, index: actualIndex }) => {
      const values: { [date: string]: string | number } = {};
      const config = SERIES_CONFIG[seriesCode];
      
      m.timeseries.data.forEach((row, rowIndex) => {
        const date = dates[rowIndex];
        const value = row[actualIndex];
        values[date] = this.formatValue(value, config?.type || 'value');
      });

      return { 
        seriesName: config?.displayName || seriesCode,
        originalCode: seriesCode,
        values,
        type: config?.type || 'value'
      };
    });

    console.log('Rows created:', rows.length);

    return { 
      headers: ['Series Name', ...dates],
      rows,
      dateColumns: dates
    };
  });

  protected formatValue(value: unknown, type: 'percent' | 'value' = 'value'): string | number {
    if (value === null || value === undefined) return '-';
    
    if (typeof value === 'number') {
      if (type === 'percent') {
        // Valores vêm como decimal (0.8308 = 83.08%)
        return `${(value * 100).toFixed(2)}%`;
      }
      
      // Valores monetários grandes
      if (Math.abs(value) >= 1000) {
        return value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      
      return value.toFixed(2);
    }
    
    return String(value);
  }

  protected toggleExpandedView(): void {
    this.showExpandedView.set(!this.showExpandedView());
  }

  protected toggleRowSelection(seriesName: string): void {
    const selected = this.selectedRows();
    if (selected.has(seriesName)) {
      selected.delete(seriesName);
    } else {
      selected.add(seriesName);
    }
    this.selectedRows.set(new Set(selected));
  }

  protected isRowSelected(seriesName: string): boolean {
    return this.selectedRows().has(seriesName);
  }

  protected toggleAccumulate(): void {
    this.isAccumulated.set(!this.isAccumulated());
  }

  protected copySelectedRows(): void {
    const selected = this.selectedRows();
    if (selected.size === 0) {
      alert('No rows selected');
      return;
    }

    const data = this.tableData();
    const selectedData = data.rows.filter(row => selected.has(row.seriesName));
    
    const header = ['Series Name', ...data.dateColumns].join('\t');
    const rows = selectedData.map(row => {
      const values = data.dateColumns.map(date => row.values[date] || '-');
      return [row.seriesName, ...values].join('\t');
    });
    
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    alert('Selected rows copied to clipboard');
  }

  protected copyTable(): void {
    const data = this.tableData();
    const header = ['Series Name', ...data.dateColumns].join('\t');
    const rows = data.rows.map(row => {
      const values = data.dateColumns.map(date => row.values[date] || '-');
      return [row.seriesName, ...values].join('\t');
    });
    
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard');
  }
}