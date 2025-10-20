'use client';

import { useState } from 'react';
import SearchBox from './components/SearchBox';
import ResultsList from './components/ResultsList';

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<any>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          includeExplanations: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setSearchInfo({
        took: data.took,
        extractedParams: data.extractedParams,
        totalHits: data.totalHits,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Company Profile Matching Engine
          </h1>
          <p className="text-lg text-gray-600">
            Find the perfect business partners using AI-powered search
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <SearchBox onSearch={handleSearch} loading={loading} />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {searchInfo && (
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{searchInfo.totalHits}</span> results found in{' '}
                <span className="font-semibold">{searchInfo.took}ms</span>
              </div>
              {searchInfo.extractedParams && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    View extracted parameters
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(searchInfo.extractedParams, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <ResultsList results={results} loading={loading} />
        </div>
      </div>
    </main>
  );
}
