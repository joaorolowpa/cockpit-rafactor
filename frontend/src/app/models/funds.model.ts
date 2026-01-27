export interface Fund {
  id: number;
  display_name: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  fund_manager_id: number;
  asset_display_name: string;
  currency: string;
  fund_manager_name: string;
  fund_manager_display_name: string;
  commitment: number;
  unfunded: number;
  nav: number;
  contributions: number;
  distributions: number;
  dpi: number;
  rvpi: number;
  tvpi: number;
  multiple: number;
  irr: number;
}

export interface TimeSeries {
  columns: string[];
  data: unknown[][];
  index: number[];
}

export interface Metrics {
  relationship_id: number;
  timeseries: TimeSeries;
}

export interface RelationshipWithMetrics extends Relationship {
  metrics?: Metrics;
}

export interface GroupedFund {
  fundName: string;
  relationships: RelationshipWithMetrics[];
}

// Configuração de séries para exibição (igual ao React)
export const DISPLAY_SERIES = [
  'METRICS_DPI',
  'METRICS_DPI_ADJ',
  'METRICS_RVPI',
  'METRICS_TVPI',
  'RATIO_OUTSTANDING_COMMITMENTS_PERCENT',
  'SYNTHETIC_OUTSTANDING_COMMITMENTS_VALUE'
];

export interface SeriesConfig {
  displayName: string;
  type: 'percent' | 'value';
  style?: string;
}

export const SERIES_CONFIG: { [key: string]: SeriesConfig } = {
  'METRICS_DPI': {
    displayName: 'Metrics DPI (%)',
    type: 'percent',
    style: 'font-bold bg-gray-50'
  },
  'METRICS_DPI_ADJ': {
    displayName: 'Metrics DPI Adj (%)',
    type: 'percent',
    style: 'font-bold bg-gray-50'
  },
  'METRICS_RVPI': {
    displayName: 'Metrics RVPI (%)',
    type: 'percent',
    style: 'font-bold bg-gray-50'
  },
  'METRICS_TVPI': {
    displayName: 'Metrics TVPI (%)',
    type: 'percent',
    style: 'font-bold bg-gray-50'
  },
  'RATIO_OUTSTANDING_COMMITMENTS_PERCENT': {
    displayName: 'Ratio Remaining Callable (%)',
    type: 'percent',
    style: 'font-bold bg-gray-50'
  },
  'SYNTHETIC_OUTSTANDING_COMMITMENTS_VALUE': {
    displayName: 'Outstanding Commitments ($)',
    type: 'value',
    style: 'font-bold bg-gray-50'
  }
};