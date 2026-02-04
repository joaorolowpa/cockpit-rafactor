import { getCompanies } from "@/services/internal-api/companies/get-companies";
import PageTitle from "@/components/reusable/GeneralLayout/PageTitle";

interface CompanyHeaderProps {
  companyId: string;
}

export async function CompanyHeader({ companyId }: CompanyHeaderProps) {
  const companies = await getCompanies({
    companyIds: [companyId],
  });

  const displayName = companies.find(
    (company) => company.id === Number(companyId),
  )?.display_name;

  return <PageTitle title={displayName} />;
}
