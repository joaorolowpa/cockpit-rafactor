import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Metrics, DISPLAY_SERIES, SERIES_CONFIG } from '../../../../models/funds.model';

interface SeriesRow {
  seriesName: string;
  originalCode: string;
  values: { [date: string]: string | number | null };
  type: 'percent' | 'value';
}

type GroupingPeriod = 'normal' | 'month' | 'quarter' | 'year';
type Separator = ',' | '.';
type DateFormat = 'yyyy-MM-dd' | 'yyyy-MMM-dd' | 'yyyy-QQQ' | 'yyyy-dd-MM';
type EmptyValueDisplay = '0' | 'N/A' | '-' | '';

interface DateGroup {
  key: string;
  label: string;
  sortValue: number;
  rawDates: string[];
}

@Component({
  selector: 'app-metrics-table',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  templateUrl: './metrics-table.component.html',
  styleUrl: './metrics-table.component.scss'
})
export class MetricsTableComponent {
  metrics = input.required<Metrics>();
  relationshipName = input<string>('');

  protected showExpandedView = signal<boolean>(false);
  protected selectedRows = signal<Set<string>>(new Set());
  protected showSettings = signal<boolean>(false);

  protected groupingPeriod = signal<GroupingPeriod>('quarter');
  protected thousandSeparator = signal<Separator>(',');
  protected decimalSeparator = signal<Separator>('.');
  protected dateFormat = signal<DateFormat>('yyyy-QQQ');
  protected emptyValueDisplay = signal<EmptyValueDisplay>('-');

  protected readonly groupingPeriodOptions: { label: string; value: GroupingPeriod }[] = [
    { label: 'Normal', value: 'normal' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' }
  ];

  protected readonly separatorOptions: { label: string; value: Separator }[] = [
    { label: 'Comma (,)', value: ',' },
    { label: 'Dot (.)', value: '.' }
  ];

  protected readonly dateFormatOptions: { label: string; value: DateFormat }[] = [
    { label: '2024-12-31', value: 'yyyy-MM-dd' },
    { label: '2024-Dec-31', value: 'yyyy-MMM-dd' },
    { label: '2024-Q4', value: 'yyyy-QQQ' },
    { label: '2024-31-12', value: 'yyyy-dd-MM' }
  ];

  protected readonly emptyValueDisplayOptions: { label: string; value: EmptyValueDisplay }[] = [
    { label: '0', value: '0' },
    { label: 'N/A', value: 'N/A' },
    { label: '-', value: '-' },
    { label: '(empty)', value: '' }
  ];

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
    const rawDates = m.timeseries.data.map(row => String(row[dateColumnIndex]));
    const grouping = this.groupingPeriod();
    const dateFormat = this.dateFormat();
    const dateGroups = this.buildDateGroups(rawDates, grouping, dateFormat);

    // Filtra apenas as colunas que estão em DISPLAY_SERIES
    const seriesColumns = m.timeseries.columns
      .map((col, index) => ({ col, index }))
      .filter(({ col, index }) => 
        index !== dateColumnIndex && DISPLAY_SERIES.includes(col)
      );

    console.log('Filtered series columns:', seriesColumns.map(s => s.col));

    // Constrói as rows (apenas as séries filtradas)
    const rows: SeriesRow[] = seriesColumns.map(({ col: seriesCode, index: actualIndex }) => {
      const values: { [date: string]: string | number | null } = {};
      const config = SERIES_CONFIG[seriesCode];

      dateGroups.forEach(group => {
        values[group.label] = null;
      });
      
      m.timeseries.data.forEach((row, rowIndex) => {
        const rawDate = rawDates[rowIndex];
        const groupLabel = this.getGroupLabelForDate(rawDate, dateGroups);
        const value = row[actualIndex];
        values[groupLabel] = value as string | number | null;
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
      headers: ['Series Name', ...dateGroups.map(group => group.label)],
      rows,
      dateColumns: dateGroups.map(group => group.label)
    };
  });

  protected formatValue(value: unknown, type: 'percent' | 'value' = 'value'): string | number {
    if (value === null || value === undefined || value === '' || value === 0) {
      return this.emptyValueDisplay();
    }

    if (typeof value === 'number') {
      if (type === 'percent') {
        // Values come as decimal (0.8308 = 83.08%)
        return `${this.formatNumber(value * 100)}%`;
      }

      return this.formatNumber(value);
    }

    return String(value);
  }

  protected formatNumber(value: number): string {
    const thousandSeparator = this.thousandSeparator();
    const decimalSeparator = this.decimalSeparator();
    const fixed = value.toFixed(2);
    const parts = fixed.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    return decimalPart ? `${withThousands}${decimalSeparator}${decimalPart}` : withThousands;
  }

  protected buildDateGroups(rawDates: string[], grouping: GroupingPeriod, dateFormat: DateFormat): DateGroup[] {
    const groups = new Map<string, DateGroup>();

    rawDates.forEach((rawDate, index) => {
      const parsedDate = this.parseDate(rawDate);
      const groupInfo = this.getGroupingInfo(rawDate, parsedDate, grouping, index);

      if (!groups.has(groupInfo.key)) {
        groups.set(groupInfo.key, {
          key: groupInfo.key,
          label: this.formatDate(groupInfo.representativeDate, rawDate, dateFormat),
          sortValue: groupInfo.sortValue,
          rawDates: [rawDate]
        });
      } else {
        groups.get(groupInfo.key)!.rawDates.push(rawDate);
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.sortValue - b.sortValue);
  }

  protected getGroupLabelForDate(rawDate: string, groups: DateGroup[]): string {
    for (const group of groups) {
      if (group.rawDates.includes(rawDate)) return group.label;
    }
    return rawDate;
  }

  protected getGroupingInfo(rawDate: string, parsedDate: Date | null, grouping: GroupingPeriod, fallbackIndex: number): {
    key: string;
    representativeDate: Date | null;
    sortValue: number;
  } {
    if (!parsedDate) {
      return {
        key: `${grouping}:${rawDate}`,
        representativeDate: null,
        sortValue: fallbackIndex
      };
    }

    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth();
    const quarter = Math.floor(month / 3) + 1;

    switch (grouping) {
      case 'month': {
        const key = `${year}-${month + 1}`;
        const repDate = new Date(year, month, 1);
        return { key, representativeDate: repDate, sortValue: repDate.getTime() };
      }
      case 'quarter': {
        const key = `${year}-Q${quarter}`;
        const repDate = new Date(year, (quarter - 1) * 3, 1);
        return { key, representativeDate: repDate, sortValue: repDate.getTime() };
      }
      case 'year': {
        const key = `${year}`;
        const repDate = new Date(year, 0, 1);
        return { key, representativeDate: repDate, sortValue: repDate.getTime() };
      }
      case 'normal':
      default: {
        return {
          key: `normal:${rawDate}`,
          representativeDate: parsedDate,
          sortValue: parsedDate.getTime()
        };
      }
    }
  }

  protected parseDate(rawDate: string): Date | null {
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  protected formatDate(date: Date | null, rawDate: string, format: DateFormat): string {
    if (!date) return rawDate;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const monthIndex = month + 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarter = Math.floor(month / 3) + 1;

    const pad = (value: number) => String(value).padStart(2, '0');

    switch (format) {
      case 'yyyy-MMM-dd':
        return `${year}-${months[month]}-${pad(day)}`;
      case 'yyyy-QQQ':
        return `${year}-Q${quarter}`;
      case 'yyyy-dd-MM':
        return `${year}-${pad(day)}-${pad(monthIndex)}`;
      case 'yyyy-MM-dd':
      default:
        return `${year}-${pad(monthIndex)}-${pad(day)}`;
    }
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

  protected toggleSettingsMenu(): void {
    this.showSettings.set(!this.showSettings());
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
      const values = data.dateColumns.map(date => this.formatValue(row.values[date], row.type) || '-');
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
      const values = data.dateColumns.map(date => this.formatValue(row.values[date], row.type) || '-');
      return [row.seriesName, ...values].join('\t');
    });
    
    const text = [header, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard');
  }
}

