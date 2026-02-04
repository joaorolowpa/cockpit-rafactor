"use client";

export type ColmeiaHistoryApiItem = {
  id?: number;
  colmeia_id?: number;
  colmeiaId?: number;
  version: number;
  created_by_name?: string;
  created_at?: string;
  score_final_geral?: number;
  variacao_vs_ultima_versao?: number | null;
  variacao_governance_vs_ultima_versao?: number | null;
  variacao_people_management_vs_ultima_versao?: number | null;
  variacao_processes_and_operations_vs_ultima_versao?: number | null;
  variacao_innovation_vs_ultima_versao?: number | null;
  variacao_environmental_sustainability_vs_ultima_versao?: number | null;
  variacao_social_responsibility_vs_ultima_versao?: number | null;
  variacao_financial_transparency_vs_ultima_versao?: number | null;
  governance_score_avg?: number;
  governance_justification?: string;
  people_management_score_avg?: number;
  people_management_justification?: string;
  processes_and_operations_score_avg?: number;
  processes_and_operations_justification?: string;
  innovation_score_avg?: number;
  innovation_justification?: string;
  environmental_sustainability_score_avg?: number;
  environmental_sustainability_justification?: string;
  social_responsibility_score_avg?: number;
  social_responsibility_justification?: string;
  financial_transparency_score_avg?: number;
  financial_transparency_justification?: string;
};

export type ColmeiaHistorySummaryResponse = {
  items: ColmeiaHistoryApiItem[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
    has_next: boolean;
    total_items?: number;
    total_pages?: number;
    current_page?: number;
  };
};

export type ScoreCell = {
  score: number;
  variation: number | null;
};

export type ColmeiaHistoryRow = {
  colmeiaId: number | null;
  version: string;
  date: string;
  finalScore: number;
  variation: number | null;
  owner: string;
  governanceScore: ScoreCell;
  peopleManagementScore: ScoreCell;
  processesAndOperationsScore: ScoreCell;
  innovationScore: ScoreCell;
  environmentalSustainabilityScore: ScoreCell;
  socialResponsibilityScore: ScoreCell;
  financialTransparencyScore: ScoreCell;
  governanceJustification: string;
  peopleManagementJustification: string;
  processesAndOperationsJustification: string;
  innovationJustification: string;
  environmentalSustainabilityJustification: string;
  socialResponsibilityJustification: string;
  financialTransparencyJustification: string;
};

export const CATEGORY_ORDER = [
  "Governance",
  "People Management",
  "Processes and Operations",
  "Innovation",
  "Environmental Sustainability",
  "Social Responsibility",
  "Financial Transparency",
];

export const formatVariation = (value: number | null) => {
  if (value === null) return "-";
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return "0.0";
};

export const variationClass = (value: number | null) => {
  if (value === null) return "text-muted-foreground";
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
};

export const parseVersion = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
};

export const parseDate = (value: string) => {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return 0;
  return new Date(year, month - 1, day).getTime();
};

const parseDateFromApi = (value: string | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const createCategoryCell = (
  currentValue: unknown,
  variationValue: unknown,
): ScoreCell => ({
  score: toNumber(currentValue),
  variation: toNullableNumber(variationValue),
});

const mapHistoryItem = (item: ColmeiaHistoryApiItem): ColmeiaHistoryRow => ({
  colmeiaId:
    typeof item.id === "number" && Number.isFinite(item.id)
      ? item.id
      : typeof item.colmeia_id === "number" && Number.isFinite(item.colmeia_id)
        ? item.colmeia_id
        : typeof item.colmeiaId === "number" && Number.isFinite(item.colmeiaId)
          ? item.colmeiaId
          : null,
  version: `V${item.version}`,
  date: parseDateFromApi(item.created_at),
  finalScore: toNumber(item.score_final_geral),
  variation: toNullableNumber(item.variacao_vs_ultima_versao),
  owner: item.created_by_name ?? "Unknown",
  governanceScore: createCategoryCell(
    item.governance_score_avg,
    item.variacao_governance_vs_ultima_versao,
  ),
  peopleManagementScore: createCategoryCell(
    item.people_management_score_avg,
    item.variacao_people_management_vs_ultima_versao,
  ),
  processesAndOperationsScore: createCategoryCell(
    item.processes_and_operations_score_avg,
    item.variacao_processes_and_operations_vs_ultima_versao,
  ),
  innovationScore: createCategoryCell(
    item.innovation_score_avg,
    item.variacao_innovation_vs_ultima_versao,
  ),
  environmentalSustainabilityScore: createCategoryCell(
    item.environmental_sustainability_score_avg,
    item.variacao_environmental_sustainability_vs_ultima_versao,
  ),
  socialResponsibilityScore: createCategoryCell(
    item.social_responsibility_score_avg,
    item.variacao_social_responsibility_vs_ultima_versao,
  ),
  financialTransparencyScore: createCategoryCell(
    item.financial_transparency_score_avg,
    item.variacao_financial_transparency_vs_ultima_versao,
  ),
  governanceJustification: item.governance_justification ?? "-",
  peopleManagementJustification: item.people_management_justification ?? "-",
  processesAndOperationsJustification:
    item.processes_and_operations_justification ?? "-",
  innovationJustification: item.innovation_justification ?? "-",
  environmentalSustainabilityJustification:
    item.environmental_sustainability_justification ?? "-",
  socialResponsibilityJustification:
    item.social_responsibility_justification ?? "-",
  financialTransparencyJustification:
    item.financial_transparency_justification ?? "-",
});

export const mapHistoryData = (items: ColmeiaHistoryApiItem[]) =>
  [...items].sort((left, right) => right.version - left.version).map(mapHistoryItem);

export const normalizeHistoryItems = (data: unknown): ColmeiaHistoryApiItem[] => {
  if (Array.isArray(data)) return data as ColmeiaHistoryApiItem[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown[] }).items)
  ) {
    return (data as { items: ColmeiaHistoryApiItem[] }).items;
  }
  return [];
};

export const normalizePagination = (
  data: unknown,
  fallback: { limit: number; page: number },
) => {
  const pagination =
    data && typeof data === "object"
      ? (data as { pagination?: ColmeiaHistorySummaryResponse["pagination"] })
          .pagination
      : undefined;

  const limit =
    typeof pagination?.limit === "number" && pagination.limit > 0
      ? pagination.limit
      : fallback.limit;
  const currentPage =
    typeof pagination?.current_page === "number" && pagination.current_page > 0
      ? pagination.current_page
      : typeof pagination?.offset === "number"
        ? Math.floor(pagination.offset / Math.max(1, limit)) + 1
        : fallback.page;

  const totalItems =
    typeof pagination?.total_items === "number" && pagination.total_items >= 0
      ? pagination.total_items
      : undefined;
  const totalPages =
    typeof pagination?.total_pages === "number" && pagination.total_pages > 0
      ? pagination.total_pages
      : totalItems !== undefined
        ? Math.max(1, Math.ceil(totalItems / Math.max(1, limit)))
        : currentPage + (pagination?.has_next ? 1 : 0);

  return {
    limit,
    currentPage,
    totalItems: totalItems ?? (currentPage - 1) * limit,
    totalPages,
  };
};
