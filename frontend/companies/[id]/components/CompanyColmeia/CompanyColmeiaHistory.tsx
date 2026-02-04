"use client";

import React from "react";
import { Eye, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";

import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";

import CompanyColmeiaForm from "./CompanyColmeiaForm";
import CompanyColmeiaHistoryDetailsDialog from "./CompanyColmeiaHistoryDetailsDialog";
import CompanyColmeiaHistoryTable, {
  ColumnDef,
  HistoryRow,
} from "./CompanyColmeiaHistoryTable";
import {
  CATEGORY_ORDER,
  ColmeiaHistoryRow,
  ColmeiaHistorySummaryResponse,
  ScoreCell,
  formatVariation,
  mapHistoryData,
  normalizeHistoryItems,
  normalizePagination,
  parseDate,
  parseVersion,
  variationClass,
} from "./colmeia-history-helpers";

type BaseRow = ColmeiaHistoryRow;

const buildInitialHistorySignature = (
  data: ColmeiaHistorySummaryResponse | null | undefined,
) => {
  if (!data) return "null";
  const pagination = data.pagination;
  const paginationKey = [
    pagination.limit,
    pagination.offset,
    pagination.returned,
    pagination.has_next,
    pagination.total_items ?? "",
    pagination.total_pages ?? "",
    pagination.current_page ?? "",
  ].join("|");
  const itemsKey = data.items
    .map((item) =>
      [
        item.id ?? "",
        item.version,
        item.created_at ?? "",
        item.score_final_geral ?? "",
        item.variacao_vs_ultima_versao ?? "",
      ].join(":"),
    )
    .join(",");
  return `${paginationKey}::${itemsKey}`;
};

const renderScoreCell = (value: ScoreCell) => (
  <div className="text-center">
    <div className="text-primary font-semibold">{value.score.toFixed(1)}</div>
    <div className={`text-xs ${variationClass(value.variation)}`}>
      ( {formatVariation(value.variation)} )
    </div>
  </div>
);

export default function CompanyColmeiaHistory({
  initialHistoryData,
}: {
  initialHistoryData?: ColmeiaHistorySummaryResponse | null;
}) {
  const params = useParams<{ id: string }>();
  const renderStartRef = React.useRef<number | null>(null);
  const didInitServerPagination = React.useRef(false);
  const lastInitialSignatureRef = React.useRef<string>("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(initialHistoryData === undefined);
  const [historyRowsState, setHistoryRowsState] = React.useState<ColmeiaHistoryRow[]>(
    () => (initialHistoryData ? mapHistoryData(initialHistoryData.items) : []),
  );
  const companyId = React.useMemo(() => {
    const companyIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
    return companyIdParam && !Number.isNaN(Number(companyIdParam))
      ? Number(companyIdParam)
      : null;
  }, [params.id]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(
    initialHistoryData?.pagination.limit ?? 50,
  );
  const [totalItems, setTotalItems] = React.useState(
    initialHistoryData?.pagination.total_items ?? 0,
  );
  const [totalPages, setTotalPages] = React.useState(
    initialHistoryData?.pagination.total_pages ?? 1,
  );
  const [pendingDelete, setPendingDelete] = React.useState<ColmeiaHistoryRow | null>(
    null,
  );
  const [selectedDetails, setSelectedDetails] =
    React.useState<ColmeiaHistoryRow | null>(null);
  const [sortKey, setSortKey] = React.useState<string>("version");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc",
  );

  const loadHistory = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const resolvedCompanyId = companyId ?? 2;
      const offset = (currentPage - 1) * pageSize;

      const response = await fetch(
        `/api/colmeia/history?company_id=${encodeURIComponent(String(resolvedCompanyId))}&limit=${pageSize}&offset=${offset}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(
          "Failed to fetch colmeia history",
          response.status,
          errorBody,
        );
        setHistoryRowsState([]);
        return;
      }

      const data = await response.json();
      const items = normalizeHistoryItems(data);
      const mappedRows = mapHistoryData(items);
      setHistoryRowsState(mappedRows);
      const pagination = normalizePagination(data, {
        limit: pageSize,
        page: currentPage,
      });
      setTotalItems(pagination.totalItems);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch colmeia history", error);
      setHistoryRowsState([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, currentPage, pageSize]);

  React.useEffect(() => {
    if (initialHistoryData === undefined) return;
    const nextSignature = buildInitialHistorySignature(initialHistoryData);
    if (lastInitialSignatureRef.current === nextSignature) return;
    lastInitialSignatureRef.current = nextSignature;

    const nextRows = initialHistoryData ? mapHistoryData(initialHistoryData.items) : [];
    const nextPageSize = initialHistoryData?.pagination.limit ?? 50;
    const nextCurrentPage =
      initialHistoryData?.pagination.current_page ??
      (initialHistoryData?.pagination
        ? Math.floor(
            initialHistoryData.pagination.offset /
              Math.max(1, initialHistoryData.pagination.limit),
          ) + 1
        : 1);
    const nextTotalItems = initialHistoryData?.pagination.total_items ?? 0;
    const nextTotalPages = initialHistoryData?.pagination.total_pages ?? 1;

    setHistoryRowsState((prev) => {
      if (prev.length !== nextRows.length) return nextRows;
      const isSame = prev.every((row, index) => {
        const next = nextRows[index];
        return (
          row.colmeiaId === next.colmeiaId &&
          row.version === next.version &&
          row.date === next.date &&
          row.finalScore === next.finalScore &&
          row.variation === next.variation &&
          row.owner === next.owner
        );
      });
      return isSame ? prev : nextRows;
    });
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
    setCurrentPage((prev) => (prev === nextCurrentPage ? prev : nextCurrentPage));
    setTotalItems((prev) => (prev === nextTotalItems ? prev : nextTotalItems));
    setTotalPages((prev) => (prev === nextTotalPages ? prev : nextTotalPages));
    setIsLoading(false);
  }, [initialHistoryData]);

  React.useEffect(() => {
    if (!isLoading && renderStartRef.current !== null) {
      console.log(
        "[ColmeiaHistory] Total until render:",
        `${(performance.now() - renderStartRef.current).toFixed(1)}ms`,
      );
      renderStartRef.current = null;
    }
  }, [isLoading, historyRowsState, sortKey, sortDirection]);

  React.useEffect(() => {
    if (initialHistoryData === undefined) {
      loadHistory();
      return;
    }
    if (!didInitServerPagination.current) {
      didInitServerPagination.current = true;
      return;
    }
    loadHistory();
  }, [currentPage, pageSize, initialHistoryData, loadHistory]);

  const comparators = React.useMemo(
    () => ({
      version: (left: BaseRow, right: BaseRow) =>
        parseVersion(left.version) - parseVersion(right.version),
      date: (left: BaseRow, right: BaseRow) => parseDate(left.date) - parseDate(right.date),
      finalScore: (left: BaseRow, right: BaseRow) => left.finalScore - right.finalScore,
    }),
    [],
  );

  const sortedRows = React.useMemo(() => {
    const compare = comparators[sortKey as keyof typeof comparators];
    if (!compare) return historyRowsState;
    const nextRows = [...historyRowsState].sort(compare);
    return sortDirection === "asc" ? nextRows : nextRows.reverse();
  }, [comparators, historyRowsState, sortKey, sortDirection]);

  const columns = React.useMemo<ColumnDef[]>(
    () => [
      {
        label: "#",
        value: "version",
        sortable: true,
        headerClassName: "w-[90px]",
        cellClassName: "text-center font-medium",
      },
      {
        label: "Date",
        value: "date",
        sortable: true,
        headerClassName: "w-[200px] text-center",
        cellClassName: "text-center",
      },
      {
        label: "Final Score",
        value: "finalScore",
        sortable: true,
        headerClassName: "w-[150px] text-center",
        cellClassName: "text-center",
        render: (value) => renderScoreCell(value as ScoreCell),
      },
      ...CATEGORY_ORDER.map((category) => ({
        label: category,
        value:
          ({
            Governance: "governanceScore",
            "People Management": "peopleManagementScore",
            "Processes and Operations": "processesAndOperationsScore",
            Innovation: "innovationScore",
            "Environmental Sustainability": "environmentalSustainabilityScore",
            "Social Responsibility": "socialResponsibilityScore",
            "Financial Transparency": "financialTransparencyScore",
          }[category] as string),
        headerClassName: "min-w-[160px] text-center",
        cellClassName: "text-center",
        render: (value: HistoryRow[keyof HistoryRow]) =>
          value && typeof value === "object" ? renderScoreCell(value as ScoreCell) : "-",
      })),
      {
        label: "Owner",
        value: "owner",
        headerClassName: "min-w-[180px]",
      },
      {
        label: "Actions",
        value: "actions",
        headerClassName: "w-[190px] text-right",
        cellClassName: "text-right",
      },
    ],
    [],
  );

  const rows = React.useMemo<HistoryRow[]>(
    () =>
      sortedRows.map((row) => ({
        version: row.version,
        colmeiaId: row.colmeiaId,
        date: row.date,
        finalScore: { score: row.finalScore, variation: row.variation },
        governanceScore: row.governanceScore,
        peopleManagementScore: row.peopleManagementScore,
        processesAndOperationsScore: row.processesAndOperationsScore,
        innovationScore: row.innovationScore,
        environmentalSustainabilityScore: row.environmentalSustainabilityScore,
        socialResponsibilityScore: row.socialResponsibilityScore,
        financialTransparencyScore: row.financialTransparencyScore,
        owner: row.owner,
        actions: (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="View details"
              onClick={() => handleOpenDetails(row)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Delete evaluation"
              onClick={() => handleDeleteClick(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      })),
    [sortedRows],
  );

  const handleSort = (nextKey: string) => {
    setSortDirection((prev) =>
      sortKey === nextKey ? (prev === "asc" ? "desc" : "asc") : "desc",
    );
    setSortKey(nextKey);
  };

  const handleDeleteClick = (row: ColmeiaHistoryRow) => {
    setPendingDelete(row);
    setIsConfirmOpen(true);
  };

  const resolveColmeiaId = React.useCallback(
    async (row: ColmeiaHistoryRow): Promise<number | null> => {
      if (row.colmeiaId) return row.colmeiaId;

      const companyIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
      const companyId =
        companyIdParam && !Number.isNaN(Number(companyIdParam))
          ? Number(companyIdParam)
          : null;
      if (companyId === null) return null;

      const rawHistoryRes = await fetch(
        `/api/colmeia/history?company_id=${encodeURIComponent(String(companyId))}&limit=50&offset=0&mode=raw`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      if (!rawHistoryRes.ok) return null;

      const rawHistory = normalizeHistoryItems(await rawHistoryRes.json());
      const targetVersion = parseVersion(row.version);
      const matched = rawHistory.find(
        (item) =>
          Number(item.version) === targetVersion && typeof item.id === "number",
      );
      return matched?.id ?? null;
    },
    [params.id],
  );

  const handleOpenDetails = (row: ColmeiaHistoryRow) => {
    setSelectedDetails(row);
    setIsDetailsOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const colmeiaId = await resolveColmeiaId(pendingDelete);
    if (!colmeiaId) {
      console.error("Missing colmeia id for delete", pendingDelete);
      setPendingDelete(null);
      setIsConfirmOpen(false);
      return;
    }

    await deleteDataWithToast({
      endpoint: `/v1/colmeia/${colmeiaId}`,
    });

    await loadHistory();
    setPendingDelete(null);
    setIsConfirmOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Colmeia History</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New evaluation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-md border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading colmeia history...
              </div>
            </div>
          ) : rows.length > 0 ? (
            <CompanyColmeiaHistoryTable
              columns={columns}
              rows={rows}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              rowKey={(row) => String(row.version)}
              pageSize={pageSize}
              currentPage={currentPage}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onPageSizeChange={(nextSize) => {
                setCurrentPage(1);
                setPageSize(nextSize);
              }}
            />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-md border">
              <div className="text-sm text-muted-foreground">
                No history found.
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <ConfirmationDialog
        header="Delete evaluation"
        text={`Are you sure you want to delete the ${pendingDelete?.version ?? ""} evaluation?`}
        isOpen={isConfirmOpen}
        setIsOpen={setIsConfirmOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <ReusableSheet
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="New Colmeia evaluation"
        description="Fill in the notes for this evaluation."
        variant="wide"
      >
        <CompanyColmeiaForm
          onCancel={() => setIsOpen(false)}
          onSubmitSuccess={loadHistory}
          submitMethod="POST"
        />
      </ReusableSheet>
      <CompanyColmeiaHistoryDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSelectedDetails(null);
          }
        }}
        selectedDetails={selectedDetails}
        companyId={companyId}
      />
    </Card>
  );
}
