"use client";

import React from "react";
import { X } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { getUserIdOrDefault } from "@/lib/env";
import { submitFormWithToast } from "@/modules/internal-api/submitFormWithToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompanyColmeiaFormProps = {
  onCancel: () => void;
  onSubmitSuccess?: () => void | Promise<void>;
  initialScores?: Record<string, number>;
  initialJustifications?: Record<string, string[]>;
  submitMethod?: "POST" | "PUT";
  colmeiaId?: number | string;
};

const EMPTY_SCORES: Record<string, number> = {};
const EMPTY_JUSTIFICATIONS: Record<string, string[]> = {};

const areJustificationsEqual = (
  left: Record<string, string[]>,
  right: Record<string, string[]>,
) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => {
    const leftArray = left[key] ?? [];
    const rightArray = right[key] ?? [];
    if (leftArray.length !== rightArray.length) return false;
    return leftArray.every((value, index) => value === rightArray[index]);
  });
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

const categoriesForm = [
  {
    title: { id: "governance", label: "Governance" },
    fields: [
      { id: "ClearGovernanceStructure", label: "Clear governance structure" },
      { id: "decisionMakingProcesses", label: "Decision-making processes" },
      { id: "complianceAndEthics", label: "Compliance and ethics" },
    ],
  },
  {
    title: { id: "peopleManagement", label: "People Management" },
    fields: [
      { id: "HRPolicy", label: "HR policy" },
      { id: "talentDevelopment", label: "Talent development" },
      { id: "organizationalCulture", label: "Organizational culture" },
    ],
  },
  {
    title: { id: "processesAndOperations", label: "Processes and Operations" },
    fields: [
      { id: "operationalEfficiency", label: "Operational efficiency" },
      { id: "qualityManagement", label: "Quality management" },
      {
        id: "technologicalInfrastructure",
        label: "Technological infrastructure",
      },
    ],
  },
  {
    title: { id: "innovation", label: "Innovation" },
    fields: [
      { id: "investmentInRnD", label: "R&D investment" },
      { id: "cultureOfInnovation", label: "Culture of innovation" },
      { id: "adoptionOfNewTechnologies", label: "Adoption of new technologies" },
    ],
  },
  {
    title: {
      id: "environmentalSustainability",
      label: "Environmental Sustainability",
    },
    fields: [
      { id: "environmentalPolicies", label: "Environmental policies" },
      { id: "wasteManagement", label: "Waste management" },
      { id: "energyEfficiency", label: "Energy efficiency" },
    ],
  },
  {
    title: {
      id: "socialResponsibility",
      label: "Social Responsibility",
    },
    fields: [
      { id: "socialImpact", label: "Social impact" },
      {
        id: "relationshipWithTheCommunity",
        label: "Relationship with the community",
      },
      { id: "diversityAndInclusion", label: "Diversity and inclusion" },
    ],
  },
  {
    title: {
      id: "financialTransparency",
      label: "Financial Transparency",
    },
    fields: [
      { id: "financialReports", label: "Financial reports" },
      { id: "audit", label: "Audit" },
      { id: "informationDisclosure", label: "Information disclosure" },
    ],
  },
];

export default function CompanyColmeiaForm({
  onCancel,
  onSubmitSuccess,
  initialScores = EMPTY_SCORES,
  initialJustifications = EMPTY_JUSTIFICATIONS,
  submitMethod = "POST",
  colmeiaId,
}: CompanyColmeiaFormProps) {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [scores, setScores] = React.useState<Record<string, number>>(
    initialScores,
  );
  const [justificationBullets, setJustificationBullets] = React.useState<
    Record<string, string[]>
  >(initialJustifications);
  const [justificationInput, setJustificationInput] = React.useState<
    Record<string, string>
  >({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const previousInitialScores = React.useRef<Record<string, number>>(
    initialScores,
  );
  const previousInitialJustifications = React.useRef<Record<string, string[]>>(
    initialJustifications,
  );

  const areScoresEqual = (
    left: Record<string, number>,
    right: Record<string, number>,
  ) => {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => left[key] === right[key]);
  };

  React.useEffect(() => {
    if (
      previousInitialScores.current !== initialScores &&
      !areScoresEqual(previousInitialScores.current, initialScores)
    ) {
      previousInitialScores.current = initialScores;
      setScores(initialScores);
    }
  }, [initialScores]);

  React.useEffect(() => {
    if (
      previousInitialJustifications.current !== initialJustifications &&
      !areJustificationsEqual(
        previousInitialJustifications.current,
        initialJustifications,
      )
    ) {
      previousInitialJustifications.current = initialJustifications;
      setJustificationBullets(initialJustifications);
      setJustificationInput({});
    }
  }, [initialJustifications]);

  const handleScoreChange = (key: string, value: string) => {
    if (value === "") {
      setScores((prev) => ({ ...prev, [key]: Number.NaN }));
      return;
    }
    const parsed = Number.parseFloat(value);
    setScores((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? Number.NaN : parsed,
    }));
  };

  const getAverage = (
    categoryTitle: { id: string; label: string },
    fields: Array<{ id: string; label: string }>,
  ) => {
    if (fields.length === 0) return 0;
    const total = fields.reduce<number>((sum, field) => {
      const key = `${categoryTitle.id}::${field.id}`;
      const value = Number(scores[key] ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return total / fields.length;
  };

  const addJustificationBullet = (categoryId: string, rawValue: string) => {
    const nextValue = rawValue.trim();
    if (!nextValue) return;

    setJustificationBullets((prev) => {
      const current = prev[categoryId] ?? [];
      if (current.length >= 5) return prev;
      return {
        ...prev,
        [categoryId]: [...current, nextValue],
      };
    });

    setJustificationInput((prev) => ({
      ...prev,
      [categoryId]: "",
    }));

    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[`${categoryId}::justification`];
      return nextErrors;
    });
  };

  const removeJustificationBullet = (categoryId: string, index: number) => {
    setJustificationBullets((prev) => {
      const current = prev[categoryId] ?? [];
      return {
        ...prev,
        [categoryId]: current.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const normalizedBullets: Record<string, string[]> = {};

    categoriesForm.forEach((category) => {
      category.fields.forEach((field) => {
        const key = `${category.title.id}::${field.id}`;
        const value = scores[key];
        if (!Number.isFinite(value)) {
          nextErrors[key] = "Required";
        }
      });

      const justificationKey = `${category.title.id}::justification`;
      const currentBullets = [...(justificationBullets[category.title.id] ?? [])];
      const pendingInput = (justificationInput[category.title.id] ?? "").trim();

      if (pendingInput && currentBullets.length < 5) {
        currentBullets.push(pendingInput);
      }

      normalizedBullets[category.title.id] = currentBullets;

      if (currentBullets.length < 1) {
        nextErrors[justificationKey] = "At least 1 bullet is required";
      } else if (currentBullets.length > 5) {
        nextErrors[justificationKey] = "Maximum 5 bullets";
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setJustificationBullets(normalizedBullets);
    setJustificationInput({});

    const companyIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
    const companyId =
      companyIdParam && !Number.isNaN(Number(companyIdParam))
        ? Number(companyIdParam)
        : null;

    const rawCreatedBy =
      session?.user?.id ??
      (session as unknown as { id?: number | string })?.id;
    const createdByCandidate = getUserIdOrDefault(rawCreatedBy);
    const createdBy =
      createdByCandidate !== undefined &&
      createdByCandidate !== null &&
      createdByCandidate !== "" &&
      !Number.isNaN(Number(createdByCandidate))
        ? Number(createdByCandidate)
        : null;

    if (companyId === null) {
      setErrors((prev) => ({
        ...prev,
        form: "Invalid company id.",
      }));
      return;
    }

    if (createdBy === null) {
      setErrors((prev) => ({
        ...prev,
        form: "Unable to identify the logged-in user.",
      }));
      return;
    }

    const payload = {
      company_id: companyId,
      created_by: createdBy,
      ...Object.fromEntries(
        categoriesForm.map((category) => {
          const scoresByField = Object.fromEntries(
            category.fields.map((field) => {
              const key = `${category.title.id}::${field.id}`;
              return [field.id, scores[key]];
            }),
          );

          return [
            category.title.id,
            {
              scores: scoresByField,
              justification_bullets: normalizedBullets[category.title.id] ?? [],
            },
          ];
        }),
      ),
    };

    console.log("colmeia-form-payload", payload);

    if (submitMethod === "PUT" && (colmeiaId === undefined || colmeiaId === null || colmeiaId === "")) {
      setErrors((prev) => ({
        ...prev,
        form: "Missing colmeia id for update.",
      }));
      return;
    }

    const endpoint =
      submitMethod === "PUT" ? `/v1/colmeia/${colmeiaId}` : "/v1/colmeia/";

    const wasSaved = await submitFormWithToast({
      endpoint,
      data: payload,
      method: submitMethod,
    });

    if (wasSaved) {
      await onSubmitSuccess?.();
      onCancel();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {Object.keys(errors).length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {errors.form ?? "Please fill in all required fields."}
        </div>
      ) : null}
      {categoriesForm.map((category) => (
        <div key={category.title.id} className="rounded-xl border bg-background">
          {(() => {
            const average = getAverage(category.title, category.fields);
            const averageStyle = getScoreVisualStyle(average);
            return (
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="text-sm font-semibold">{category.title.label}</div>
            <div
              className="rounded px-2 py-1 text-sm font-semibold"
              style={averageStyle}
            >
              {average.toFixed(1)}/5
            </div>
          </div>
            );
          })()}
          <div className="space-y-3 px-5 py-4">
            {category.fields.map((field) => {
              const key = `${category.title.id}::${field.id}`;
              const rawValue = scores[key];
              const value = Number.isFinite(rawValue) ? rawValue : "";
              const hasError = Boolean(errors[key]);
              const scoreStyle =
                Number.isFinite(rawValue) && !hasError
                  ? getScoreVisualStyle(rawValue)
                  : undefined;
              return (
                <div
                  key={key}
                  className="grid items-center gap-3 md:grid-cols-[1fr_160px]"
                >
                  <label className="text-sm text-muted-foreground">
                    {field.label}
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={value}
                    id={field.id}
                    name={field.id}
                    required
                    onChange={(event) =>
                      handleScoreChange(key, event.target.value)
                    }
                    className={hasError ? "border-red-400" : undefined}
                    style={scoreStyle}
                  />
                </div>
              );
            })}
            <div className="space-y-2">
              <Input
                placeholder="Type a justification and press Enter"
                value={justificationInput[category.title.id] ?? ""}
                onChange={(event) =>
                  setJustificationInput((prev) => ({
                    ...prev,
                    [category.title.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addJustificationBullet(
                      category.title.id,
                      justificationInput[category.title.id] ?? "",
                    );
                  }
                }}
                className={
                  errors[`${category.title.id}::justification`]
                    ? "border-red-400"
                    : undefined
                }
              />
              <div className="text-xs text-muted-foreground">
                Press Enter to create a bullet (min 1, max 5).
              </div>
              <div className="space-y-2">
                {(justificationBullets[category.title.id] ?? []).map(
                  (bullet, index) => (
                    <div
                      key={`${category.title.id}-bullet-${index}`}
                      className="flex items-start justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2"
                    >
                      <p className="text-sm">- {bullet}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          removeJustificationBullet(category.title.id, index)
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save evaluation</Button>
      </div>
    </form>
  );
}
