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
  relationship_metrics?: Metrics;
}

export interface GroupedFund {
  fundName: string;
  relationships: RelationshipWithMetrics[];
}

// Configuração de séries para exibição (igual ao React)
export interface FundManagerContent {
  firm_about?: string | null;
  firm_strategies?: string | null;
  website?: string | null;
  firm_aum?: string | null;
  contact_information?: string | null;
}

export interface FundManagerDetails {
  id: number;
  display_name?: string;
  content?: FundManagerContent;
}

export interface FundNote {
  note_id: number;
  note_title: string;
  content_preview?: string;
  created_at: string;
  created_by_name?: string;
}

export interface FundManagerDocument {
  id: number;
  document_type: string;
  entity_display_name: string;
  entity_type: string;
  created_by_name?: string;
  date_reference?: string | null;
  created_at?: string | null;
}

export interface RelationshipDetailsContent {
  sectors?: string | null;
  investment_team?: string | null;
  profile_of_investments?: string | null;
}

export interface RelationshipDetails {
  id: number;
  content?: RelationshipDetailsContent;
}

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
