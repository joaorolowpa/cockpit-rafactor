// ./app/src/app/dashboard/developer/nav-missing/page.tsx

import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";


export default async function NavMissingPage() {
    const endpoint = "/v1/nav/controls/count-of-saldos-per-month"
    const data = await fetchDataFromInternalAPI(endpoint)
    
    // Sort data by month
    const sortedData = [...data].sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
    )
    
    // Get all unique portfolio names (excluding 'month')
    const portfolioNames = Object.keys(data[0] || {}).filter(key => key !== 'month')

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Nav Missing Entries</h1>
            
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 sticky left-0 bg-gray-100">Month</th>
                            {portfolioNames.map(portfolio => (
                                <th key={portfolio} className="border p-2">
                                    {portfolio.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border p-2 font-medium sticky left-0 bg-inherit">
                                    {new Date(row.month).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short'
                                    })}
                                </td>
                                {portfolioNames.map(portfolio => (
                                    <td 
                                        key={portfolio} 
                                        className={`border p-2 text-center ${row[portfolio] === 0 ? 'bg-red-100' : ''}`}
                                    >
                                        {row[portfolio] === 1 ? '✓' : '✗'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
