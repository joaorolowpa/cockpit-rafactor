import { Metadata } from "next";

import CreateNewFundsNotesFileForm from "@/components/forms/files/CreateNewFundsNotesFileForm";
import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import {
  FundNoteFile,
  getFundsNotesFilesTypes,
} from "@/services/internal-api/files/get-funds-notes-files-types";

import { columns } from "./components/TableColumns";

export const fundNoteFiles: FundNoteFile[] = [
  {
    id: 1,
    name: "fund_summary_2025",
    display_name: "Fund Summary 2025",
    description: "Summary document for fund performance in 2025.",
    created_at: "2025-01-01T10:15:30Z",
  },
  {
    id: 2,
    name: "market_analysis_2024",
    display_name: "Market Analysis 2024",
    description: "Detailed market analysis and trends for 2024.",
    created_at: "2024-12-15T14:00:00Z",
  },
  {
    id: 3,
    name: "investment_plan_q1",
    display_name: "Investment Plan Q1",
    description: null,
    created_at: "2025-01-05T09:45:00Z",
  },
  {
    id: 4,
    name: "annual_report",
    display_name: "Annual Report",
    description: "Comprehensive report covering the year 2024.",
    created_at: "2024-11-20T16:30:00Z",
  },
  {
    id: 5,
    name: "risk_assessment_doc",
    display_name: "Risk Assessment Document",
    description: "Assessment of risk factors for portfolio investments.",
    created_at: "2025-01-10T12:00:00Z",
  },
];

export const metadata: Metadata = {
  title: "Funds Notes Files Types",
  description: "Overview of fund notes files types.",
};

export default async function Page() {
  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="Funds Notes Files Types"
        displayText="Overview of fund notes files types."
        buttonTitle="Add new Type"
        sheetTitle="Add new Fund Note Type"
        sheetDescription="Add a new type of fund note."
      >
        <CreateNewFundsNotesFileForm />
      </ReusableTopBar>
      <CockpitLongTable
        columns={columns}
        data={fundNoteFiles}
        searchableColumn="display_name"
        searchPlaceholder="Search for a note type"
        tableConfig={{
          isZebraStriped: true,
        }}
      />
    </div>
  );
}
