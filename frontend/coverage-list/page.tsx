import { Metadata } from "next";

import CompanyForm from "@/components/forms/old/CompanyForm";
import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { getCompanies } from "@/services/internal-api/companies/get-companies";

import { columns } from "./components/TableColumns";

export const metadata: Metadata = {
  title: "Coverage List",
  description: "Manage your companies",
};

export default async function Page() {
  try {
    const companies = await getCompanies();

    console.log('Companies data:', companies);

    return (
      <div className="space-y-4 p-4">
        <ReusableTopBar
          displayTitle="Coverage List"
          displayText="Manage your companies"
          buttonTitle="Add Company"
          sheetTitle="Add Company"
          sheetDescription="Add a new company to the list"
        >
          <CompanyForm />
        </ReusableTopBar>
        <CockpitLongTable
          columns={columns}
          data={companies}
          searchableColumn="display_name"
          searchPlaceholder="Search for a company"
          tableConfig={{
            isZebraStriped: true,
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading companies page:', error);
    return <div>Error loading companies</div>;
  }
}
