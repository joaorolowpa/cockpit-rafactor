export interface TimeSeriesValue {
  date_reference?: string;
  value?: number | string | null;
}

export interface TimeSeriesItem {
  company_time_series_id?: number;
  company_id?: number;
  series_code?: string;
  description?: string;
  unit?: string;
  frequency?: string;
  source?: string;
  case_type?: string;
  series_type?: string;
  details_created_at?: string;
  time_series_values?: TimeSeriesValue[];
}

export interface FlattenedTimeSeries {
  series_code: string;
  description?: string;
  unit?: string;
  series_type?: string;
  data_type?: string;
  date_reference?: string;
  value?: number | string | null;
}

export interface GroupedSeries {
  series_code: string;
  description?: string;
  unit?: string;
  data_type?: string;
  series_type?: string;
  values: Array<{ date_reference: string; value: number | string | null }>;
}

export interface SectionData {
  sectionLabel: string;
  sectionData: GroupedSeries[];
}

export const flattenTimeSeriesData = (data: TimeSeriesItem[]): FlattenedTimeSeries[] =>
  (data || []).flatMap((item) =>
    (item?.time_series_values || []).map((value) => ({
      series_code: item?.series_code || '',
      description: item?.description,
      unit: item?.unit,
      series_type: item?.series_type,
      data_type: undefined,
      date_reference: value?.date_reference,
      value: value?.value ?? null
    }))
  );

export const addDataType = (data: FlattenedTimeSeries[], dataType: string): FlattenedTimeSeries[] =>
  (data || []).map((item) => ({ ...item, data_type: dataType }));

export const groupDataBySeriesCode = (data: FlattenedTimeSeries[]): GroupedSeries[] => {
  const grouped: GroupedSeries[] = [];

  (data || []).forEach((item) => {
    if (!item?.series_code) return;
    const existing = grouped.find((group) => group.series_code === item.series_code);
    const value = {
      date_reference: item.date_reference || '',
      value: item.value ?? null
    };

    if (existing) {
      existing.values.push(value);
      return;
    }

    grouped.push({
      series_code: item.series_code,
      description: item.description,
      unit: item.unit,
      data_type: item.data_type,
      series_type: item.series_type,
      values: [value]
    });
  });

  return grouped;
};

const orderGroupedData = (groupedData: GroupedSeries[], seriesOrder: string[]) => {
  const orderMap = seriesOrder.reduce<Record<string, number>>((acc, code, index) => {
    acc[code] = index;
    return acc;
  }, {});

  return (groupedData || [])
    .filter((item) => seriesOrder.includes(item.series_code))
    .sort((a, b) => (orderMap[a.series_code] ?? 0) - (orderMap[b.series_code] ?? 0));
};

const filterDataByFieldReturningValues = (
  groupedData: GroupedSeries[],
  field: keyof GroupedSeries,
  fieldValue: string
) => {
  const match = (groupedData || []).find((item) => item[field] === fieldValue);
  return match ? match.values : [];
};

export const prepareMarginsChartData = (groupedData: GroupedSeries[]) => [
  {
    label: 'Gross Margin',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'synthetic_gross_margin')
  },
  {
    label: 'Ebit Margin',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'synthetic_ebit_margin')
  },
  {
    label: 'Ebitda Margin',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'synthetic_ebitda_margin')
  }
];

export const prepareGrowthChartData = (groupedData: GroupedSeries[]) => [
  {
    label: 'Rev. Growth',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'PCT_CHG_IS_NET_REVENUES')
  },
  {
    label: 'Gross Prof. Growth',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'PCT_CHG_IS_GROSS_PROFIT')
  },
  {
    label: 'Ebitda Growth',
    data: filterDataByFieldReturningValues(groupedData, 'series_code', 'PCT_CHG_IS_EBITDA')
  }
];

const prepareOperatingData = (groupedData: GroupedSeries[], companyType: string) => {
  if (companyType !== 'non-financials') return [];
  return (groupedData || []).filter((item) => item.series_type === 'OPERATING');
};

const prepareIncomeStatement = (groupedData: GroupedSeries[], companyType: string) => {
  if (companyType !== 'non-financials') return [];
  const order = [
    'IS_NET_REVENUES',
    'PCT_CHG_IS_NET_REVENUES',
    'IS_GROSS_PROFIT',
    'synthetic_gross_margin',
    'PCT_CHG_IS_GROSS_PROFIT',
    'IS_EBITDA',
    'synthetic_ebitda_margin',
    'PCT_CHG_IS_EBITDA',
    'IS_EBIT',
    'synthetic_ebit_margin',
    'PCT_CHG_IS_EBIT',
    'IS_NET_INCOME_TO_CONTROLLING',
    'synthetic_net_profit_margin',
    'PCT_CHG_IS_NET_INCOME_TO_CONTROLLING'
  ];
  return orderGroupedData(groupedData, order);
};

const prepareBalanceSheet = (groupedData: GroupedSeries[], companyType: string) => {
  if (companyType !== 'non-financials') return [];

  const balanceSheetMetrics = [
    'synthetic_bs_total_assets',
    'synthetic_bs_total_ca',
    'synthetic_bs_total_nca',
    'synthetic_bs_total_liabilities_and_equity',
    'synthetic_bs_total_cl',
    'synthetic_bs_total_ncl',
    'synthetic_bs_total_equity'
  ];
  const balanceSheetRawFinancials = [
    'BS_CA_CASH',
    'BS_CA_RECEIVABLES',
    'BS_CA_INVENTORIES',
    'BS_CA_OTHER_OPERATING',
    'BS_CA_OTHER_NON_OPERATING',
    'BS_NCA_PP&E',
    'BS_NCA_GOODWILL_INTANGIBLE',
    'BS_NCA_INVESTMENTS',
    'BS_NCA_OTHER',
    'BS_CL_DEBT',
    'BS_CL_PAYABLES',
    'BS_CL_OTHER_OPERATING',
    'BS_CL_OTHER_NON_OPERATING',
    'BS_NCL_DEBT',
    'BS_NCL_PROVISIONS',
    'BS_NCL_OTHER',
    'BS_EQ_CAPITAL',
    'BS_EQ_RETAINED_EARNINGS',
    'BS_EQ_OTHER'
  ];

  const metricsData = orderGroupedData(groupedData, balanceSheetMetrics);
  const rawData = orderGroupedData(groupedData, balanceSheetRawFinancials);
  const united = [...metricsData, ...rawData];

  const finalOrder = [
    'synthetic_bs_total_assets',
    'synthetic_bs_total_ca',
    'BS_CA_CASH',
    'BS_CA_RECEIVABLES',
    'BS_CA_INVENTORIES',
    'BS_CA_OTHER_OPERATING',
    'BS_CA_OTHER_NON_OPERATING',
    'synthetic_bs_total_nca',
    'BS_NCA_PP&E',
    'BS_NCA_GOODWILL_INTANGIBLE',
    'BS_NCA_INVESTMENTS',
    'BS_NCA_OTHER',
    'synthetic_bs_total_liabilities_and_equity',
    'synthetic_bs_total_cl',
    'BS_CL_DEBT',
    'BS_CL_PAYABLES',
    'BS_CL_OTHER_OPERATING',
    'BS_CL_OTHER_NON_OPERATING',
    'synthetic_bs_total_ncl',
    'BS_NCL_DEBT',
    'BS_NCL_PROVISIONS',
    'BS_NCL_OTHER',
    'synthetic_bs_total_equity',
    'BS_EQ_CAPITAL',
    'BS_EQ_RETAINED_EARNINGS',
    'BS_EQ_OTHER'
  ];

  return orderGroupedData(united, finalOrder);
};

export const prepareTableData = (groupedData: GroupedSeries[], companyType: string): SectionData[] => [
  { sectionLabel: 'Operating Data', sectionData: prepareOperatingData(groupedData, companyType) },
  { sectionLabel: 'Income Statement', sectionData: prepareIncomeStatement(groupedData, companyType) },
  { sectionLabel: 'Balance Sheet', sectionData: prepareBalanceSheet(groupedData, companyType) }
];
