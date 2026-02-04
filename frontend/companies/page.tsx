import { Metadata } from "next";
import Link from "next/link";

import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { getCompanies } from "@/services/internal-api/companies/get-companies";

export const metadata: Metadata = {
  title: "Companies",
  description: "Overview of all companies",
};

export default async function Page() {
  const companies = await getCompanies();

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="Companies"
        displayText="Overview of all companies"
      />
      <ul
        role="list"
        className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
      >
        {companies.map((company) => (
          <Link
            key={company.display_name}
            href={`/dashboard/research-equities/companies/${company.id}`}
            passHref
          >
            <li className="col-span-1 flex h-16 cursor-pointer rounded-md shadow-sm">
              <div className="flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-milestones-gray text-sm font-medium text-white">
                {company.display_name[0]}
              </div>
              <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                <div className="flex-1 truncate px-4 py-2 text-sm">
                  <span className="font-medium text-gray-900 hover:text-gray-600">
                    {company.display_name}
                  </span>
                </div>
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}
