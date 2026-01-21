// app/match/page.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import SingleEntitySelector from '@/components/SingleEntitySelector';
import IdealProfileBuilder, { IdealProfile } from '@/components/IdealProfileBuilder';
import WeightAllocator, { Parameter, ParameterWeight } from '@/components/WeightAllocator';
import MatchResultsList, { SearchMatchesResponse } from '@/components/MatchResultsList';
import NotionExportDialog from '@/components/NotionExportDialog';
import NotionParameterSelector, { SelectedDatabase } from '@/components/NotionParameterSelector';
import ICPQuickMatch from '@/components/ICPQuickMatch';
import { QuickMatchRequest, ICPMatchResponse } from '@/types';

type MatchMode = 'legacy' | 'icp';

export default function MatchPage() {
  // Match mode: legacy or ICP
  const [matchMode, setMatchMode] = useState<MatchMode>('legacy');

  // Legacy matching state
  const [entityId, setEntityId] = useState<string>('');
  const [idealProfile, setIdealProfile] = useState<IdealProfile>({});
  const [weights, setWeights] = useState<ParameterWeight[]>([]);
  const [matchResults, setMatchResults] = useState<SearchMatchesResponse | null>(null);

  // ICP matching state
  const [icpResults, setIcpResults] = useState<ICPMatchResponse | null>(null);
  const [isIcpLoading, setIsIcpLoading] = useState(false);

  // Shared state
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [selectedNotionDatabases, setSelectedNotionDatabases] = useState<SelectedDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Generate parameters from selected Notion databases
  const parameters = useMemo(() => {
    const params: Parameter[] = [];

    selectedNotionDatabases.forEach((db) => {
      db.parameters.forEach((param) => {
        params.push({
          name: param.id,
          label: param.name,
          type: 'notion',
          databaseName: db.name,
        });
      });
    });

    return params;
  }, [selectedNotionDatabases]);

  const handleSearch = useCallback(async () => {
    if (!idealProfile.textQuery?.trim()) {
      setError("Please enter your requirements before searching");
      return;
    }

    if (weights.length === 0) {
      setError("Please select and allocate weights to parameters");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMatchResults(null);
    setSelectedMatches([]);

    try {
      const requestData = {
        idealProfile,
        weights,
        minThreshold: 0,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/search-matches`, {
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
  }, [idealProfile, weights]);

  // ICP Quick Match handler
  const handleICPSearch = useCallback(async (request: QuickMatchRequest) => {
    setIsIcpLoading(true);
    setError(null);
    setIcpResults(null);
    setSelectedMatches([]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/icp/quick-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setIcpResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsIcpLoading(false);
    }
  }, []);


  // Prepare company data for export dialog with full details
  const selectedCompanyData = useMemo(() => {
    if (matchMode === 'legacy' && matchResults) {
      return matchResults.matches
        .filter((m) => selectedMatches.includes(m.entity.profileId))
        .map((m) => ({
          profileId: m.entity.profileId,
          matchPercentage: m.matchPercentage,
          companyDetails: m.entity.companyDetails,
          classification: m.entity.classification,
          primaryContact: (m.entity as any).primaryContact || {},
          parameterMatches: m.parameterMatches,
          ingestionDate: (m.entity as any).ingestionDate || new Date().toISOString(),
          source: (m.entity as any).source || 'unknown',
        }));
    }

    if (matchMode === 'icp' && icpResults) {
      return icpResults.matches
        .filter((m) => selectedMatches.includes(m.companyId))
        .map((m) => ({
          profileId: m.companyId,
          matchPercentage: m.matchPercentage,
          companyDetails: m.company?.companyDetails || {},
          classification: m.company?.classification || {},
          primaryContact: (m.company as any)?.primaryContact || {},
          parameterMatches: m.parameterMatches.map((p) => ({
            parameterName: p.criterionId,
            parameterLabel: p.label,
            type: p.scoringType as 'exact' | 'numeric' | 'text' | 'semantic',
            matchPercentage: p.matchPercentage,
            value1: p.icpValue,
            value2: p.companyValue,
            explanation: p.explanation,
          })),
          ingestionDate: (m.company as any)?.ingestionDate || new Date().toISOString(),
          source: (m.company as any)?.source || 'unknown',
        }));
    }

    return [];
  }, [matchResults, icpResults, selectedMatches, matchMode]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Company Match Finder</h1>
          <p className="text-gray-600 mt-2">Find matching companies using advanced scoring algorithms.</p>
        </header>

        {/* Match Mode Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setMatchMode('legacy')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  matchMode === 'legacy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Legacy Match
              </button>
              <button
                onClick={() => setMatchMode('icp')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  matchMode === 'icp'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ICP Quick Match
              </button>
            </nav>
          </div>
        </div>

        {/* Top Row - Search Interface */}
        <div className="mb-6">
          {matchMode === 'legacy' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Company Selection */}
              <div>
                <div className="bg-white rounded-lg shadow p-6 h-fit">
                  <SingleEntitySelector onSelect={setEntityId} />
                </div>
              </div>

              {/* Right Column - Profile Builder & Weights Combined */}
              <div>
                <div className="bg-white rounded-lg shadow p-6">
                  {/* Notion Parameter Selector */}
                  <div className="mb-6">
                    <NotionParameterSelector onParametersChange={setSelectedNotionDatabases} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Ideal Profile Builder */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Define Ideal Profile</h3>
                    <IdealProfileBuilder onProfileChange={setIdealProfile} />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Weight Allocator */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Weights</h3>
                    {parameters.length > 0 && (
                      <WeightAllocator
                        parameters={parameters}
                        onWeightsChange={setWeights}
                      />
                    )}

                    {parameters.length === 0 && (
                      <p className="text-gray-600 text-center">Select Notion databases above to see parameters</p>
                    )}
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={!idealProfile.textQuery?.trim() || weights.length === 0 || isLoading}
                    className="mt-6 w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading ? 'Searching...' : 'Search for Matches'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <ICPQuickMatch onSearch={handleICPSearch} isLoading={isIcpLoading} />
            </div>
          )}
        </div>

        {/* Bottom Row - Match Results */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            {(isLoading || isIcpLoading) && (
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

            {/* Legacy Results */}
            {matchMode === 'legacy' && matchResults && !isLoading && !error && (
              <>
                <MatchResultsList
                  data={matchResults}
                  onSelectionsChange={setSelectedMatches}
                />

                {selectedMatches.length > 0 && (
                  <button
                    onClick={() => setExportDialogOpen(true)}
                    className="mt-6 w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Send {selectedMatches.length} to Notion
                  </button>
                )}
              </>
            )}

            {/* ICP Results */}
            {matchMode === 'icp' && icpResults && !isIcpLoading && !error && (
              <>
                <MatchResultsList
                  data={icpResults}
                  onSelectionsChange={setSelectedMatches}
                  isICPResult={true}
                />

                {selectedMatches.length > 0 && (
                  <button
                    onClick={() => setExportDialogOpen(true)}
                    className="mt-6 w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Send {selectedMatches.length} to Notion
                  </button>
                )}
              </>
            )}

            {/* No Results State */}
            {((matchMode === 'legacy' && !matchResults) || (matchMode === 'icp' && !icpResults)) && !isLoading && !isIcpLoading && !error && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {matchMode === 'legacy'
                    ? 'Enter your ideal profile and allocate weights to find matches.'
                    : 'Define criteria and weights to find matching companies.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <NotionExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        selectedCompanies={selectedCompanyData}
      />
    </div>
  );
}
