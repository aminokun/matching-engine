// app/page.tsx
"use client";

import { useState } from 'react';
import SingleEntitySelector from '@/components/SingleEntitySelector';
import IdealProfileBuilder, { IdealProfile } from '@/components/IdealProfileBuilder';
import MatchResults, { MatchResultData } from '@/components/MatchResults';

export default function Home() {
  const [entityId, setEntityId] = useState<string>('');
  const [idealProfile, setIdealProfile] = useState<IdealProfile>({});
  const [matchResults, setMatchResults] = useState<MatchResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!entityId) {
      setError("Please select a company before searching");
      return;
    }

    if (!idealProfile.textQuery?.trim()) {
      setError("Please enter your requirements before searching");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchResults(null);

    try {
      const requestData = {
        entityId,
        idealProfile,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/match-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setMatchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Match Finder</h1>
          <p className="text-gray-600 mt-2">Select a company, define your ideal partner, and find the best matches.</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <SingleEntitySelector onSelect={setEntityId} />
            </div>
          </div>
          
          {/* Middle Column - Ideal Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <IdealProfileBuilder onProfileChange={setIdealProfile} />
            </div>
          </div>

          {/* Right Column - Match Results */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Match Results</h2>
              
              <button
                onClick={handleSearch}
                disabled={isLoading || !entityId || !idealProfile.textQuery?.trim()}
                className={`w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
                  (isLoading || !entityId || !idealProfile.textQuery?.trim()) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-6`}
              >
                {isLoading ? 'Searching...' : 'Find Matches'}
              </button>

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Finding matches...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              {matchResults && !isLoading && !error && (
                <MatchResults data={matchResults} loading={isLoading} />
              )}
              
              {!matchResults && !isLoading && !error && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No search performed yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a company and define your ideal profile to find matches.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}