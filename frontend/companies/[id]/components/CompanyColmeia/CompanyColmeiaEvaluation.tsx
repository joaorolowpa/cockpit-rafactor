"use client";

import React from "react";
import { LoaderCircle, PencilLine } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";

import CompanyColmeiaForm from "./CompanyColmeiaForm";
import { categoryFieldMap } from "./colmeia-constants";

type ColmeiaCategory = {
  id: string;
  label: string;
  score: number;
  param?: {
    scores?: Record<string, number>;
    justification?: string;
    justification_bullets?: string[];
  };
};

export type ColmeiaLatestResponse = {
  id: number;
  payload?: Record<
    string,
    {
      scores?: Record<string, number>;
      justification?: string;
      justification_bullets?: string[];
    }
  >;
  score_final_geral?: number;
  score_por_categoria?: Record<string, number>;
  updated_at?: string;
  created_at?: string;
};

const MAX_SCORE = 5;

const CATEGORY_LABEL_BY_ID: Record<string, string> = {
  governance: "Governance",
  peopleManagement: "People Management",
  processesAndOperations: "Processes and Operations",
  innovation: "Innovation",
  environmentalSustainability: "Environmental Sustainability",
  socialResponsibility: "Social Responsibility",
  financialTransparency: "Financial Transparency",
};

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

const clampScore = (value: number) => Math.max(0, Math.min(5, value));

const getScoreVisualStyle = (value: number) => {
  const normalized = clampScore(value) / 5;
  const hue = Math.round(normalized * 120); // 0 = red, 120 = green
  return {
    color: `hsl(${hue} 78% 32%)`,
    borderColor: `hsl(${hue} 62% 58%)`,
    backgroundColor: `hsl(${hue} 70% 96%)`,
  } as React.CSSProperties;
};

const toCategoryData = (
  latest: ColmeiaLatestResponse | null | undefined,
): ColmeiaCategory[] =>
  Object.keys(categoryFieldMap).map((id) => ({
    id,
    label: CATEGORY_LABEL_BY_ID[id] ?? id,
    score: Number(latest?.score_por_categoria?.[id] ?? 0),
    param: latest?.payload?.[id] ?? {},
  }));

export default function CompanyColmeiaEvaluation({
  initialLatestData = null,
}: {
  initialLatestData?: ColmeiaLatestResponse | null;
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!initialLatestData);
  const [officialScore, setOfficialScore] = React.useState(
    Number(initialLatestData?.score_final_geral ?? 0),
  );
  const [currentColmeiaId, setCurrentColmeiaId] = React.useState<number | null>(
    initialLatestData?.id ?? null,
  );
  const [latestUpdatedAt, setLatestUpdatedAt] = React.useState<string | null>(
    initialLatestData?.updated_at ?? initialLatestData?.created_at ?? null,
  );
  const [colmeiaData, setColmeiaData] = React.useState<ColmeiaCategory[]>(
    toCategoryData(initialLatestData),
  );

  const loadLatest = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const companyIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
      const companyId =
        companyIdParam && !Number.isNaN(Number(companyIdParam))
          ? Number(companyIdParam)
          : null;

      if (!companyId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/colmeia/latest?company_id=${encodeURIComponent(String(companyId))}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(
          "Failed to load latest colmeia",
          response.status,
          errorBody,
        );
        return;
      }

      const latest = (await response.json()) as ColmeiaLatestResponse | null;
      if (!latest) return;

      const nextData = toCategoryData(latest);

      setColmeiaData(nextData);
      setOfficialScore(Number(latest.score_final_geral ?? 0));
      setCurrentColmeiaId(latest.id);
      setLatestUpdatedAt(latest.updated_at ?? latest.created_at ?? null);
    } catch (error) {
      console.error("Failed to load latest colmeia", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    if (!initialLatestData) {
      loadLatest();
    }
  }, [initialLatestData, loadLatest]);

  React.useEffect(() => {
    if (!initialLatestData) return;
    setColmeiaData(toCategoryData(initialLatestData));
    setOfficialScore(Number(initialLatestData.score_final_geral ?? 0));
    setCurrentColmeiaId(initialLatestData.id ?? null);
    setLatestUpdatedAt(
      initialLatestData.updated_at ?? initialLatestData.created_at ?? null,
    );
    setIsLoading(false);
  }, [initialLatestData]);

  const initialScores = React.useMemo(() => {
    const entries: Array<[string, number]> = [];
    colmeiaData.forEach((category) => {
      const fields = categoryFieldMap[category.id] ?? [];
      fields.forEach((field) => {
        const scoreValue = category.param?.scores?.[field];
        const value = typeof scoreValue === "number" ? scoreValue : category.score ?? 0;
        entries.push([`${category.id}::${field}`, value]);
      });
    });
    return Object.fromEntries(entries);
  }, [colmeiaData]);
  const initialJustifications = React.useMemo(() => {
    const entries: Array<[string, string[]]> = [];
    colmeiaData.forEach((category) => {
      const bullets =
        category.param && Array.isArray(category.param.justification_bullets)
          ? category.param.justification_bullets.filter(
              (item): item is string => typeof item === "string",
            )
          : [];
      const fallbackJustification =
        category.param && typeof category.param.justification === "string"
          ? category.param.justification.trim()
          : "";
      entries.push([
        category.id,
        bullets.length > 0
          ? bullets
          : fallbackJustification
            ? [fallbackJustification]
            : [],
      ]);
    });
    return Object.fromEntries(entries);
  }, [colmeiaData]);
  return (
    <>
      <div className="relative">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-base">Colmeia Evaluation</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={currentColmeiaId === null}
                onClick={() => setIsOpen(true)}
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Edit Colmeia
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="text-sm font-medium text-muted-foreground">
                Official Score
              </div>
              <div
                className="mt-3 inline-flex rounded-md border px-3 py-1 text-3xl font-semibold"
                style={getScoreVisualStyle(officialScore)}
              >
                {officialScore.toFixed(1)}
              </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  of {MAX_SCORE.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border p-5">
                <ChartContainer
                  config={chartConfig}
                  className="h-[320px] w-full"
                >
                  <RadarChart data={colmeiaData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, MAX_SCORE]} tickCount={6} />
                    <Radar
                      dataKey="score"
                      fill="var(--color-score)"
                      fillOpacity={0.2}
                      stroke="var(--color-score)"
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                Evaluated Categories
              </div>
              <div className="space-y-3">
                {colmeiaData.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border bg-muted/10 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <span
                      className="rounded border px-2 py-1 text-sm font-semibold"
                      style={getScoreVisualStyle(item.score)}
                    >
                      {item.score.toFixed(1)} / {MAX_SCORE}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            {latestUpdatedAt
              ? `Updated at ${new Date(latestUpdatedAt).toLocaleDateString("en-US")}`
              : "No updates available"}
          </CardFooter>
        </Card>
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading colmeia evaluation...
            </div>
          </div>
        ) : null}
      </div>

      <ReusableSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Edit Colmeia evaluation"
        description="Update the scores for the current evaluation."
        variant="wide"
      >
        <CompanyColmeiaForm
          onCancel={() => setIsOpen(false)}
          onSubmitSuccess={loadLatest}
          initialScores={initialScores}
          initialJustifications={initialJustifications}
          submitMethod="PUT"
          colmeiaId={currentColmeiaId ?? undefined}
        />
      </ReusableSheet>
    </>
  );
}
