"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ScoreCell = {
  score: number;
  variation: number | null;
};

export type HistoryDetailsRow = {
  colmeiaId: number | null;
  version: string;
  owner: string;
  governanceScore: ScoreCell;
  peopleManagementScore: ScoreCell;
  processesAndOperationsScore: ScoreCell;
  innovationScore: ScoreCell;
  environmentalSustainabilityScore: ScoreCell;
  socialResponsibilityScore: ScoreCell;
  financialTransparencyScore: ScoreCell;
};

type ColmeiaDetailsResponse = {
  id: number;
  version: number;
  created_at?: string;
  score_final_geral?: number;
  variacao_vs_ultima_versao?: number | null;
  payload?: Record<
    string,
    {
      scores?: Record<string, number>;
      justification?: string;
      justification_bullets?: string[];
    }
  >;
  score_por_categoria?: Record<string, number>;
};

const parseVersion = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
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

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toBullets = (value?: string | null) =>
  (value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const formatVariation = (value: number | null) => {
  if (value === null) return "-";
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return "0.0";
};

const clampScore = (value: number) => Math.max(0, Math.min(5, value));

const getScoreVisualStyle = (value: number) => {
  const normalized = clampScore(value) / 5;
  const hue = Math.round(normalized * 120);
  return {
    color: `hsl(${hue} 78% 32%)`,
    borderColor: `hsl(${hue} 62% 58%)`,
    backgroundColor: `hsl(${hue} 70% 96%)`,
  } as React.CSSProperties;
};

const normalizeHistoryItems = (data: unknown) => {
  if (Array.isArray(data)) return data as Array<{ id?: number; version?: number }>;
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: Array<{ id?: number; version?: number }> }).items;
  }
  return [];
};

export default function CompanyColmeiaHistoryDetailsDialog({
  isOpen,
  onOpenChange,
  selectedDetails,
  companyId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDetails: HistoryDetailsRow | null;
  companyId: number | null;
}) {
  const [isDetailsLoading, setIsDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [colmeiaDetails, setColmeiaDetails] = React.useState<ColmeiaDetailsResponse | null>(
    null,
  );

  React.useEffect(() => {
    if (!isOpen || !selectedDetails) return;

    const loadDetails = async () => {
      setIsDetailsLoading(true);
      setDetailsError(null);
      setColmeiaDetails(null);
      try {
        let resolvedId = selectedDetails.colmeiaId;

        if (!resolvedId && companyId !== null) {
          const rawHistoryRes = await fetch(
            `/api/colmeia/history?company_id=${encodeURIComponent(String(companyId))}&limit=50&offset=0&mode=raw`,
            { method: "GET", cache: "no-store" },
          );

          if (rawHistoryRes.ok) {
            const rawHistory = normalizeHistoryItems(await rawHistoryRes.json());
            const targetVersion = parseVersion(selectedDetails.version);
            const matched = rawHistory.find(
              (item) =>
                Number(item.version) === targetVersion && typeof item.id === "number",
            );
            resolvedId = matched?.id ?? null;
          }
        }

        if (!resolvedId) {
          setDetailsError("Missing colmeia id for this row.");
          return;
        }

        const response = await fetch(`/api/colmeia/${resolvedId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new Error(`Failed to load details (${response.status}) ${errorBody}`);
        }

        const data = (await response.json()) as ColmeiaDetailsResponse;
        setColmeiaDetails(data);
      } catch (error) {
        console.error("Failed to load colmeia details", error);
        setDetailsError("Failed to load detailed information.");
      } finally {
        setIsDetailsLoading(false);
      }
    };

    loadDetails();
  }, [companyId, isOpen, selectedDetails]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {`Evaluation details ${selectedDetails?.version ?? ""}`}
          </DialogTitle>
          <DialogDescription>
            Scores, comparisons and justifications for this version.
          </DialogDescription>
        </DialogHeader>
        {selectedDetails ? (
          <div className="space-y-4">
            {isDetailsLoading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading details...
                </div>
              </div>
            ) : null}

            {detailsError ? (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {detailsError}
              </div>
            ) : null}

            {!isDetailsLoading && !detailsError && colmeiaDetails ? (
              <>
                <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Version</div>
                    <div className="font-medium">V{colmeiaDetails.version}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="font-medium">{parseDateFromApi(colmeiaDetails.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                    <div className="font-medium">{selectedDetails.owner}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Final Score</div>
                    <div
                      className="inline-flex rounded border px-2 py-1 font-medium"
                      style={getScoreVisualStyle(toNumber(colmeiaDetails.score_final_geral))}
                    >
                      {toNumber(colmeiaDetails.score_final_geral).toFixed(1)} (
                      {formatVariation(toNullableNumber(colmeiaDetails.variacao_vs_ultima_versao))}
                      )
                    </div>
                  </div>
                </div>

                {[
                  {
                    label: "Governance",
                    key: "governance",
                    score: toNumber(colmeiaDetails.score_por_categoria?.governance),
                    variation: selectedDetails.governanceScore.variation,
                    bullets:
                      colmeiaDetails.payload?.governance?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.governance?.justification),
                    scores: colmeiaDetails.payload?.governance?.scores ?? {},
                  },
                  {
                    label: "People Management",
                    key: "peopleManagement",
                    score: toNumber(colmeiaDetails.score_por_categoria?.peopleManagement),
                    variation: selectedDetails.peopleManagementScore.variation,
                    bullets:
                      colmeiaDetails.payload?.peopleManagement?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.peopleManagement?.justification),
                    scores: colmeiaDetails.payload?.peopleManagement?.scores ?? {},
                  },
                  {
                    label: "Processes and Operations",
                    key: "processesAndOperations",
                    score: toNumber(colmeiaDetails.score_por_categoria?.processesAndOperations),
                    variation: selectedDetails.processesAndOperationsScore.variation,
                    bullets:
                      colmeiaDetails.payload?.processesAndOperations?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.processesAndOperations?.justification),
                    scores: colmeiaDetails.payload?.processesAndOperations?.scores ?? {},
                  },
                  {
                    label: "Innovation",
                    key: "innovation",
                    score: toNumber(colmeiaDetails.score_por_categoria?.innovation),
                    variation: selectedDetails.innovationScore.variation,
                    bullets:
                      colmeiaDetails.payload?.innovation?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.innovation?.justification),
                    scores: colmeiaDetails.payload?.innovation?.scores ?? {},
                  },
                  {
                    label: "Environmental Sustainability",
                    key: "environmentalSustainability",
                    score: toNumber(colmeiaDetails.score_por_categoria?.environmentalSustainability),
                    variation: selectedDetails.environmentalSustainabilityScore.variation,
                    bullets:
                      colmeiaDetails.payload?.environmentalSustainability?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.environmentalSustainability?.justification),
                    scores: colmeiaDetails.payload?.environmentalSustainability?.scores ?? {},
                  },
                  {
                    label: "Social Responsibility",
                    key: "socialResponsibility",
                    score: toNumber(colmeiaDetails.score_por_categoria?.socialResponsibility),
                    variation: selectedDetails.socialResponsibilityScore.variation,
                    bullets:
                      colmeiaDetails.payload?.socialResponsibility?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.socialResponsibility?.justification),
                    scores: colmeiaDetails.payload?.socialResponsibility?.scores ?? {},
                  },
                  {
                    label: "Financial Transparency",
                    key: "financialTransparency",
                    score: toNumber(colmeiaDetails.score_por_categoria?.financialTransparency),
                    variation: selectedDetails.financialTransparencyScore.variation,
                    bullets:
                      colmeiaDetails.payload?.financialTransparency?.justification_bullets ??
                      toBullets(colmeiaDetails.payload?.financialTransparency?.justification),
                    scores: colmeiaDetails.payload?.financialTransparency?.scores ?? {},
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{item.label}</h4>
                      <span
                        className="rounded border px-2 py-1 text-sm font-semibold"
                        style={getScoreVisualStyle(item.score)}
                      >
                        {item.score.toFixed(1)} ({formatVariation(item.variation)})
                      </span>
                    </div>
                    <div className="mb-3 grid gap-2 md:grid-cols-3">
                      {Object.entries(item.scores).map(([metric, value]) => (
                        <div
                          key={`${item.key}-${metric}`}
                          className="rounded border bg-muted/30 px-2 py-1 text-xs"
                        >
                          <span className="block text-muted-foreground">{metric}</span>
                          <span
                            className="inline-block rounded border px-1.5 py-0.5 font-medium"
                            style={getScoreVisualStyle(Number(value))}
                          >
                            {Number(value).toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Justifications
                      </div>
                      {item.bullets.length > 0 ? (
                        item.bullets.map((bullet, index) => (
                          <div
                            key={`${item.key}-bullet-${index}`}
                            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                          >
                            <span className="mr-2 font-semibold text-muted-foreground">
                              {index + 1}.
                            </span>
                            {bullet}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
