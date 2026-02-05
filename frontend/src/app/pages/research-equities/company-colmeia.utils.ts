import { ColmeiaHistoryItem, ColmeiaLatestResponse } from './company-colmeia.service';

export interface ColmeiaCategory {
  id: string;
  label: string;
  score: number;
}

export const COLMEIA_CATEGORY_LABELS: Array<{ id: string; label: string }> = [
  { id: 'governance', label: 'Governance' },
  { id: 'peopleManagement', label: 'People Management' },
  { id: 'processesAndOperations', label: 'Processes and Operations' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'environmentalSustainability', label: 'Environmental Sustainability' },
  { id: 'socialResponsibility', label: 'Social Responsibility' },
  { id: 'financialTransparency', label: 'Financial Transparency' }
];

export const mapLatestToCategories = (latest: ColmeiaLatestResponse | null): ColmeiaCategory[] =>
  COLMEIA_CATEGORY_LABELS.map((category) => ({
    id: category.id,
    label: category.label,
    score: Number(latest?.score_por_categoria?.[category.id] ?? 0)
  }));

export interface ColmeiaHistoryRow {
  id: number | null;
  version: string;
  date: string;
  finalScore: ScoreCell;
  governance: ScoreCell;
  peopleManagement: ScoreCell;
  processesAndOperations: ScoreCell;
  innovation: ScoreCell;
  environmentalSustainability: ScoreCell;
  socialResponsibility: ScoreCell;
  financialTransparency: ScoreCell;
  owner: string;
}

export interface ScoreCell {
  score: number;
  variation: number | null;
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US');
};

export const formatVariation = (value: number | null) => {
  if (value === null) return '-';
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return '0.0';
};

export const mapHistoryRows = (items: ColmeiaHistoryItem[]): ColmeiaHistoryRow[] =>
  (items || [])
    .slice()
    .sort((left, right) => toNumber(right.version) - toNumber(left.version))
    .map((item) => ({
      id:
        typeof item.id === 'number'
          ? item.id
          : typeof item.colmeia_id === 'number'
            ? item.colmeia_id
            : null,
      version: `V${toNumber(item.version)}`,
      date: formatDate(item.created_at as string | undefined),
      finalScore: {
        score: toNumber(item.score_final_geral),
        variation: toNullableNumber(item.variacao_vs_ultima_versao)
      },
      governance: {
        score: toNumber(item.governance_score_avg),
        variation: toNullableNumber(item.variacao_governance_vs_ultima_versao)
      },
      peopleManagement: {
        score: toNumber(item.people_management_score_avg),
        variation: toNullableNumber(item.variacao_people_management_vs_ultima_versao)
      },
      processesAndOperations: {
        score: toNumber(item.processes_and_operations_score_avg),
        variation: toNullableNumber(item.variacao_processes_and_operations_vs_ultima_versao)
      },
      innovation: {
        score: toNumber(item.innovation_score_avg),
        variation: toNullableNumber(item.variacao_innovation_vs_ultima_versao)
      },
      environmentalSustainability: {
        score: toNumber(item.environmental_sustainability_score_avg),
        variation: toNullableNumber(item.variacao_environmental_sustainability_vs_ultima_versao)
      },
      socialResponsibility: {
        score: toNumber(item.social_responsibility_score_avg),
        variation: toNullableNumber(item.variacao_social_responsibility_vs_ultima_versao)
      },
      financialTransparency: {
        score: toNumber(item.financial_transparency_score_avg),
        variation: toNullableNumber(item.variacao_financial_transparency_vs_ultima_versao)
      },
      owner: (item.created_by_name as string | undefined) ?? 'Unknown'
    }));
