'use client';

import React, { useState, useEffect } from 'react';
import WeightAllocator, { Parameter, ParameterWeight } from '@/components/WeightAllocator';
import EntitySelector from '@/components/EntitySelector';
import MatchResults, { MatchResultData } from '@/components/MatchResults';

interface ApiParameter {
  name: string;
  label: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
}

export default function MatchPage() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [weights, setWeights] = useState<ParameterWeight[]>([]);
  const [entity1Id, setEntity1Id] = useState<string>('');
  const [entity2Id, setEntity2Id] = useState<string>('');
  const [results, setResults] = useState<MatchResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loadingParameters, setLoadingParameters] = useState(true);

  // Fetch available parameters on mount
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/parameters');
        if (!response.ok) {
          throw new Error('Failed to fetch parameters');
        }
        const data = await response.json();
        setParameters(data.parameters || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch parameters');
      } finally {
        setLoadingParameters(false);
      }
    };

    fetchParameters();
  }, []);

  // Calculate match when weights and entities are both selected
  useEffect(() => {
    if (weights.length > 0 && entity1Id && entity2Id && entity1Id !== entity2Id) {
      calculateMatch();
    }
  }, [weights, entity1Id, entity2Id]);

  const calculateMatch = async () => {
    if (weights.length === 0 || !entity1Id || !entity2Id) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity1Id,
          entity2Id,
          weights,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate match');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate match');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightsChange = (newWeights: ParameterWeight[]) => {
    setWeights(newWeights);
  };

  const handleEntitySelect = (ent1Id: string, ent2Id: string) => {
    setEntity1Id(ent1Id);
    setEntity2Id(ent2Id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Company Matching Engine</h1>
          <p className="text-lg text-gray-700">
            Configure weights for parameters and find how well companies match based on your priorities
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Configuration */}
          <div className="space-y-8">
            {/* Step 1: Weight Allocator */}
            <section>
              <div className="sticky top-8">
                {!loadingParameters ? (
                  <WeightAllocator
                    parameters={parameters}
                    onWeightsChange={handleWeightsChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
                    <p className="text-center text-gray-600">Loading parameters...</p>
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Entity Selector */}
            <section>
              <div className="sticky top-96">
                <EntitySelector
                  onSelect={handleEntitySelect}
                  loading={loading}
                  error={error}
                />
              </div>
            </section>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-8">
            {results && (
              <section className="sticky top-8">
                <MatchResults data={results} loading={loading} />
              </section>
            )}

            {!results && !loading && weights.length > 0 && entity1Id && entity2Id && (
              <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <p className="text-center text-gray-600">
                  Select two different companies to see match results
                </p>
              </div>
            )}

            {!results && weights.length === 0 && (
              <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <p className="text-center text-gray-600">
                  Configure weights and select companies to calculate matches
                </p>
              </div>
            )}

            {loading && (
              <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                  </div>
                  <p className="text-gray-600 mt-4">Calculating match...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Help */}
        <div className="mt-16 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Set Weights</h3>
              <p className="text-sm text-gray-600">
                Select which parameters matter for your matching and assign weights. Weights must sum to 100%.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Select Companies</h3>
              <p className="text-sm text-gray-600">
                Choose two different companies from the database to compare against your configured weights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Review Results</h3>
              <p className="text-sm text-gray-600">
                See how the companies match with a detailed breakdown showing which parameters aligned best.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
