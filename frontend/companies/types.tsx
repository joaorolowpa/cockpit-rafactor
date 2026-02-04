// ./cockpit/src/types/CompanyPage.ts

export interface TimeSeriesValue {
  date_reference: string;
  value: number;
}

export interface TimeSeries {
  company_time_series_id: string;
  description: string;
  series_code: string;
  unit: string;
  time_series_values: TimeSeriesValue[];
  series_type: string;
}

export interface GroupedData {
  name: string;
  series: TimeSeries[];
}

export interface ContentFinancialsData {
  groupedData: GroupedData[];
  dateColumns: string[];
}

export interface SectionItem {
  title: string;
  createdAt: string;
  createdBy: string;
  filePath: string;
  id: number;
  userEmail: string;
}

export interface ContentDocumentsData {
  DocumentsThesis: SectionItem[];
  DocumentsNotes: SectionItem[];
  DocumentsPDFs: SectionItem[];
  DocumentsFinancialModels: SectionItem[];
}

export interface ContentHoneyCombData {
  // Define the structure of ContentHoneyCombData based on your needs
}
