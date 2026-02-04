"use client";
import { differenceInDays, format, parseISO } from "date-fns";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { CompanyThesis } from "@/components/forms/old/CompanyThesis";
import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { fetchThesisByDocumentId } from "@/services/internal-api/v2-research-companies-thesis";

interface SectionItem {
  title: string;
  createdAt: string;
  createdBy: string;
  filePath: string;
  id: number;
  userEmail?: string;
  userName?: string;
  text_html?: string;
  text_markdown?: string;
}

interface ThesisSectionProps {
  title: string;
  buttonLabel: string;
  items: SectionItem[];
  companyId: string;
  sheetTitle: string;
  sheetDescription: string;
  userId: number;
}

const ThesisSection: React.FC<ThesisSectionProps> = ({
  title,
  buttonLabel,
  items,
  companyId,
  sheetTitle,
  sheetDescription,
  userId,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [openSheet, setIsOpenSheet] = useState(false);
  const [viewSheet, setViewSheet] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<SectionItem | null>(null);
  const [thesisHtml, setThesisHtml] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setIsOpenSheet(true);
  };

  const handleRowAction = async (item: SectionItem, actionType: string) => {
    if (actionType === "view") {
      const thesisData: SectionItem[] = await fetchThesisByDocumentId(
        item.id.toString(),
      );
      if (thesisData.length > 0) {
        const thesis = thesisData[0];
        setThesisHtml(thesis.text_html);
        setViewSheet(true);
      }
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;

    const endpoint = `/v2/research/companies/document/${currentItem.id}`;
    const pathToRevalidate = `/dashboard/research-equities/companies?company_id=${companyId}&selected_tab=documents`;
    await deleteDataWithToast({ endpoint, pathToRevalidate });

    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const renderItem = (item: SectionItem, index: number) => {
    const createdAtDate = parseISO(item.createdAt);
    const isDeletable = differenceInDays(new Date(), createdAtDate) < 7;

    return (
      <div
        key={index}
        className="flex cursor-pointer items-center justify-between gap-x-4 border-b px-6 py-4 hover:bg-gray-100"
        onClick={() => handleRowAction(item, "view")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-x-3">
            <p className="text-sm font-semibold text-gray-900">
              {item.title || format(createdAtDate, "yyyy-MMM-dd")}
            </p>
            {index === 0 && (
              <span className="mt-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Most Recent
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
            <p>Created at {format(createdAtDate, "PPP")}</p>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1} />
            </svg>
            <p>Created by {item.createdBy}</p>
            {item.userEmail && <p>{item.userEmail}</p>}
            {item.userName && <p>{item.userName}</p>}
          </div>
        </div>
        <div
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-200"
            onClick={() => handleRowAction(item, "edit")}
            disabled
            title="Editing is not implemented yet"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              if (isDeletable) {
                setCurrentItem(item);
                setIsDialogOpen(true);
              }
            }}
            disabled={!isDeletable}
            title={
              !isDeletable
                ? "Cannot delete items older than 7 days"
                : "Delete item"
            }
          >
            <Trash2
              className={`h-5 w-5 ${
                !isDeletable ? "text-gray-400" : "text-red-600"
              }`}
            />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-2"
      >
        <div className="flex cursor-pointer items-center justify-between space-x-4 border-b bg-gray-50 px-6 py-4 hover:bg-gray-100">
          <CollapsibleTrigger asChild>
            <button className="flex w-full flex-1 items-center gap-2 text-left text-base font-semibold">
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              />
              {title}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Plus className="mr-2 h-4 w-4" />
              {buttonLabel}
            </Button>
          </div>
        </div>
        <CollapsibleContent className="max-h-96 overflow-y-auto">
          {items.length > 0 ? (
            <>
              {renderItem(items[0], 0)}
              <div className="space-y-2">
                {items
                  .slice(1)
                  .map((item, index) => renderItem(item, index + 1))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No items available.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <ReusableSheet
        isOpen={openSheet}
        setIsOpen={setIsOpenSheet}
        title={sheetTitle}
        description={sheetDescription}
        variant="default"
      >
        <CompanyThesis
          companyId={companyId}
          userId={userId}
          setIsOpen={setIsOpenSheet}
        />
      </ReusableSheet>

      {viewSheet && (
        <ReusableSheet
          isOpen={viewSheet}
          setIsOpen={setViewSheet}
          title="View Thesis"
          description="Thesis Details"
          variant="wide"
        >
          <div
            className="m-5 space-y-8"
            dangerouslySetInnerHTML={{ __html: thesisHtml || "" }}
          />
        </ReusableSheet>
      )}

      {isDialogOpen && (
        <ConfirmationDialog
          header="Confirm Deletion"
          text="Are you sure you want to delete this item?"
          onConfirm={handleDelete}
          onCancel={handleCancel}
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
        />
      )}
    </>
  );
};

export default ThesisSection;
