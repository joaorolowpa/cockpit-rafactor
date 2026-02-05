// PrepareDataUtils.tsx

export const flattenTimeSeriesData = (data) => {
  return data.flatMap(
    (item) =>
      item?.time_series_values?.map((value) => ({
        company_time_series_id: item?.company_time_series_id,
        company_id: item?.company_id,
        series_code: item?.series_code,
        description: item?.description,
        unit: item?.unit,
        frequency: item?.frequency,
        source: item?.source,
        case_type: item?.case_type,
        series_type: item?.series_type,
        details_created_at: item?.details_created_at,
        date_reference: value?.date_reference,
        update_date: value?.update_date,
        value: value?.value,
        created_at: value?.created_at,
        is_estimate: value?.is_estimate,
      })) || [],
  );
};

export const orderGroupedData = (groupedData, seriesOrder) => {
  const orderMap = seriesOrder.reduce((acc, code, index) => {
    acc[code] = index;
    return acc;
  }, {});

  const orderedData = groupedData
    .filter((item) => seriesOrder.includes(item.series_code))
    .sort((a, b) => orderMap[a.series_code] - orderMap[b.series_code]);

  return orderedData;
};

export const filterDataByField = (groupedData, field, fieldValue) => {
  return groupedData.filter((item) => item[field] === fieldValue);
};

export const filterDataByFieldReturningValues = (
  groupedData,
  field,
  fieldValue,
) => {
  const filteredData = groupedData.filter((item) => item[field] === fieldValue);
  return filteredData.length > 0 ? filteredData[0].values : [];
};

export const groupDataBySeriesCode = (data) => {
  const groupedData = data.reduce((acc, item) => {
    const existingGroup = acc.find(
      (group) => group.series_code === item.series_code,
    );

    if (existingGroup) {
      existingGroup.values.push({
        date_reference: item.date_reference,
        value: item.value,
      });
    } else {
      const newGroup = {
        series_code: item.series_code,
        description: item.description,
        unit: item.unit,
        data_type: item.data_type,
        series_type: item.series_type,
        values: [
          {
            date_reference: item.date_reference,
            value: item.value,
          },
        ],
      };
      acc.push(newGroup);
    }

    return acc;
  }, []);

  return groupedData;
};

export const addDataType = (data, dataType) => {
  return data.map((item) => ({ ...item, data_type: dataType }));
};

export const prepareMarginsChartData = (groupedData) => {
  return [
    {
      label: "Gross Margin",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "synthetic_gross_margin",
      ),
    },
    {
      label: "Ebit Margin",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "synthetic_ebit_margin",
      ),
    },
    {
      label: "Ebitda Margin",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "synthetic_ebitda_margin",
      ),
    },
  ];
};

export const prepareGrowthChartData = (groupedData) => {
  return [
    {
      label: "Rev. Growth",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "PCT_CHG_IS_NET_REVENUES",
      ),
    },
    {
      label: "Gross Prof. Growth",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "PCT_CHG_IS_GROSS_PROFIT",
      ),
    },
    {
      label: "Ebitda Growth",
      data: filterDataByFieldReturningValues(
        groupedData,
        "series_code",
        "PCT_CHG_IS_EBITDA",
      ),
    },
  ];
};

export const transformRowToChartData = (row, labelKey) => {
  const data = Object.entries(row)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key)) // Match date strings like 2021-12-31
    .map(([date_reference, value]) => ({
      date_reference,
      value,
    }));

  return {
    label: row[labelKey],
    data,
  };
};

// Prepare operating data for non-financials
export const prepareOperatingData = (groupedData, companyType) => {
  if (companyType !== "non-financials") return [];
  return addDataType(
    filterDataByField(groupedData, "series_type", "OPERATING"),
    "operating",
  );
};

// Prepare income statement data for non-financials
export const prepareIncomeStatement = (groupedData, companyType) => {
  if (companyType !== "non-financials") return [];
  const IncomeStatementOrder = [
    "IS_NET_REVENUES",
    "PCT_CHG_IS_NET_REVENUES",
    "IS_GROSS_PROFIT",
    "synthetic_gross_margin",
    "PCT_CHG_IS_GROSS_PROFIT",
    "IS_EBITDA",
    "synthetic_ebitda_margin",
    "PCT_CHG_IS_EBITDA",
    "IS_EBIT",
    "synthetic_ebit_margin",
    "PCT_CHG_IS_EBIT",
    "IS_NET_INCOME_TO_CONTROLLING",
    "synthetic_net_profit_margin",
    "PCT_CHG_IS_NET_INCOME_TO_CONTROLLING",
  ];
  return orderGroupedData(groupedData, IncomeStatementOrder);
};

// Prepare balance sheet data for non-financials
export const prepareBalanceSheet = (groupedData, companyType) => {
  if (companyType !== "non-financials") return [];

  // Define balance sheet orders
  const balanceSheetMetrics = [
    "synthetic_bs_total_assets",
    "synthetic_bs_total_ca",
    "synthetic_bs_total_nca",
    "synthetic_bs_total_liabilities_and_equity",
    "synthetic_bs_total_cl",
    "synthetic_bs_total_ncl",
    "synthetic_bs_total_equity",
  ];
  const balanceSheetRawFinancials = [
    "BS_CA_CASH",
    "BS_CA_RECEIVABLES",
    "BS_CA_INVENTORIES",
    "BS_CA_OTHER_OPERATING",
    "BS_CA_OTHER_NON_OPERATING",
    "BS_NCA_PP&E",
    "BS_NCA_GOODWILL_INTANGIBLE",
    "BS_NCA_INVESTMENTS",
    "BS_NCA_OTHER",
    "BS_CL_DEBT",
    "BS_CL_PAYABLES",
    "BS_CL_OTHER_OPERATING",
    "BS_CL_OTHER_NON_OPERATING",
    "BS_NCL_DEBT",
    "BS_NCL_PROVISIONS",
    "BS_NCL_OTHER",
    "BS_EQ_CAPITAL",
    "BS_EQ_RETAINED_EARNINGS",
    "BS_EQ_OTHER",
  ];

  // Prepare data with types
  const balanceSheetMetricsData = addDataType(
    orderGroupedData(groupedData, balanceSheetMetrics),
    "bs_metrics",
  );
  const balanceSheetRawData = addDataType(
    orderGroupedData(groupedData, balanceSheetRawFinancials),
    "bs_raw",
  );
  const unitedBalanceSheet = [
    ...balanceSheetMetricsData,
    ...balanceSheetRawData,
  ];

  // Define the final order for the balance sheet
  const BalanceSheetOrder = [
    "synthetic_bs_total_assets",
    "synthetic_bs_total_ca",
    "BS_CA_CASH",
    "BS_CA_RECEIVABLES",
    "BS_CA_INVENTORIES",
    "BS_CA_OTHER_OPERATING",
    "BS_CA_OTHER_NON_OPERATING",
    "synthetic_bs_total_nca",
    "BS_NCA_PP&E",
    "BS_NCA_GOODWILL_INTANGIBLE",
    "BS_NCA_INVESTMENTS",
    "BS_NCA_OTHER",
    "synthetic_bs_total_liabilities_and_equity",
    "synthetic_bs_total_cl",
    "BS_CL_DEBT",
    "BS_CL_PAYABLES",
    "BS_CL_OTHER_OPERATING",
    "BS_CL_OTHER_NON_OPERATING",
    "synthetic_bs_total_ncl",
    "BS_NCL_DEBT",
    "BS_NCL_PROVISIONS",
    "BS_NCL_OTHER",
    "synthetic_bs_total_equity",
    "BS_EQ_CAPITAL",
    "BS_EQ_RETAINED_EARNINGS",
    "BS_EQ_OTHER",
  ];
  return orderGroupedData(unitedBalanceSheet, BalanceSheetOrder);
};

// Consolidate table data preparation
export const prepareTableData = (groupedData, companyType) => {
  return [
    {
      sectionLabel: "Operating Data",
      sectionData: prepareOperatingData(groupedData, companyType),
    },
    {
      sectionLabel: "Income Statement",
      sectionData: prepareIncomeStatement(groupedData, companyType),
    },
    {
      sectionLabel: "Balance Sheet",
      sectionData: prepareBalanceSheet(groupedData, companyType),
    },
  ];
};
