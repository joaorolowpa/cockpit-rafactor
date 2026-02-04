"use client";

import React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type CategoryComparison = {
  category: string;
  previousScore: number;
  currentScore: number;
  variation: number;
};

type ColmeiaComparison = {
  companyName: string;
  previousLabel: string;
  previousScore: number;
  currentLabel: string;
  currentScore: number;
  variation: number;
  categories: CategoryComparison[];
};

const comparisonData: ColmeiaComparison = {
  companyName: "Microsoft",
  previousLabel: "Nov/2024",
  previousScore: 4.1,
  currentLabel: "Dez/2024",
  currentScore: 4.2,
  variation: 0.1,
  categories: [
    { category: "Governance", previousScore: 4.5, currentScore: 4.5, variation: 0 },
    {
      category: "People Management",
      previousScore: 4.0,
      currentScore: 4.5,
      variation: 0.5,
    },
    {
      category: "Processes and Operations",
      previousScore: 4.5,
      currentScore: 4.0,
      variation: -0.5,
    },
    { category: "Innovation", previousScore: 3.5, currentScore: 4.5, variation: 1.0 },
    {
      category: "Environmental Sustainability",
      previousScore: 4.5,
      currentScore: 4.5,
      variation: 0,
    },
    {
      category: "Social Responsibility",
      previousScore: 4.5,
      currentScore: 4.0,
      variation: -0.5,
    },
    {
      category: "Financial Transparency",
      previousScore: 4.5,
      currentScore: 4.5,
      variation: 0,
    },
  ],
};

function formatVariation(value: number) {
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return value.toFixed(1);
  return "0.0";
}

function variationClass(value: number) {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

export default function CompanyColmeiaComparison() {

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {comparisonData.companyName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparison: Current Version vs. Previous Version
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-xl border bg-muted/30 p-6 text-center">
              <div className="text-sm text-muted-foreground">Previous Version</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {comparisonData.previousLabel}
              </div>
              <div className="mt-3 text-3xl font-semibold">
                {comparisonData.previousScore.toFixed(1)}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Variation
              </span>
              <span
                className={`mt-1 text-3xl font-semibold ${variationClass(
                  comparisonData.variation,
                )}`}
              >
                {formatVariation(comparisonData.variation)}
              </span>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
              <div className="text-sm text-primary">Current Version</div>
              <div className="mt-1 text-xs text-primary">
                {comparisonData.currentLabel}
              </div>
              <div className="mt-3 text-3xl font-semibold text-primary">
                {comparisonData.currentScore.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-4">
            <div className="mb-3 text-sm font-semibold">
              Changes by category
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[120px] text-center">Previous</TableHead>
                  <TableHead className="w-[120px] text-center">Current</TableHead>
                  <TableHead className="w-[120px] text-center">Variation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.categories.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell className="text-center">{category.previousScore.toFixed(1)}</TableCell>
                    <TableCell className="font-semibold text-center text-primary">
                      {category.currentScore.toFixed(1)}
                    </TableCell>
                    <TableCell className={[variationClass(category.variation), "text-center"].join(" ")}>
                      {formatVariation(category.variation)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </>
  );
}
