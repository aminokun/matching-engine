'use client';

interface Result {
  profileId: string;
  score: number;
  companyDetails: {
    companyName: string;
    country: string;
    city: string;
    summaryOfActivity?: string;
    numberOfEmployees?: number;
    annualTurnover?: number;
    website?: string;
  };
  classification: {
    profileType: string;
    marketSegment?: string[];
    keywords?: string[];
    servicesOffered?: string[];
  };
  primaryContact?: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
  };
}

interface ResultsListProps {
  results: Result[];
  loading: boolean;
}

export default function ResultsList({ results, loading }: ResultsListProps) {
  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Searching...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-8 text-center p-8 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try searching for companies using natural language
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {results.map((result, index) => (
        <div
          key={result.profileId}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {result.companyDetails.companyName}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {result.classification.profileType}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {result.companyDetails.city}, {result.companyDetails.country}
                </span>
                {result.companyDetails.numberOfEmployees && (
                  <span>
                    {result.companyDetails.numberOfEmployees} employees
                  </span>
                )}
              </div>

              {result.companyDetails.summaryOfActivity && (
                <p className="text-gray-700 mb-3 line-clamp-2">
                  {result.companyDetails.summaryOfActivity}
                </p>
              )}

              {result.classification.servicesOffered && result.classification.servicesOffered.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {result.classification.servicesOffered.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              )}

              {result.primaryContact && (
                <div className="text-sm text-gray-600 mt-3 pt-3 border-t">
                  <strong>Contact:</strong> {result.primaryContact.firstName}{' '}
                  {result.primaryContact.lastName}
                  {result.primaryContact.jobTitle && ` - ${result.primaryContact.jobTitle}`}
                  {result.primaryContact.email && (
                    <span className="ml-2">({result.primaryContact.email})</span>
                  )}
                </div>
              )}
            </div>

            <div className="ml-4 flex flex-col items-end">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((result.score / Math.max(...results.map(r => r.score))) * 100)}%
              </div>
              <div className="text-xs text-gray-500">match</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
