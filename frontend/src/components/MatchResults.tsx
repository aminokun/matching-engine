'use client';

import React from 'react';
import { ChevronDownIcon } from 'lucide-react';

export interface ParameterMatch {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number;
  value1: any;
  value2: any;
  explanation: string;
}

export interface MatchResultData {
  entity1Id: string;
  entity1Name: string;
  entity2Id: string;
  entity2Name: string;
  totalMatchPercentage: number;
  parameterMatches: ParameterMatch[];
  weights: Array<{ parameterName: string; weight: number }>;
  timestamp: string;
}

export interface MatchResultsProps {
  data: MatchResultData;
  loading?: boolean;
}

export default function MatchResults({ data, loading = false }: MatchResultsProps) {
  const [expandedParameters, setExpandedParameters] = React.useState<Set<string>>(new Set());

  const toggleParameter = (paramName: string) => {
    const newExpanded = new Set(expandedParameters);
    if (newExpanded.has(paramName)) {
      newExpanded.delete(paramName);
    } else {
      newExpanded.add(paramName);
    }
    setExpandedParameters(newExpanded);
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 75) return 'text-green-700';
    if (percentage >= 50) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getMatchBgColor = (percentage: number): string => {
    if (percentage >= 75) return 'bg-green-100';
    if (percentage >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'number' && value > 1000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">Calculating match...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Match Results</h2>
        <p className="text-gray-600">
          Detailed breakdown of how {data.entity1Name} and {data.entity2Name} match
        </p>
      </div>

      {/* Total Match Percentage - Large Display */}
      <div className="mb-8 text-center">
        <div className="inline-block">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="85"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="85"
                stroke={
                  data.totalMatchPercentage >= 75
                    ? '#16a34a'
                    : data.totalMatchPercentage >= 50
                      ? '#eab308'
                      : '#dc2626'
                }
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(data.totalMatchPercentage / 100) * 534.07} 534.07`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className={`text-5xl font-bold ${
                    data.totalMatchPercentage >= 75
                      ? 'text-green-700'
                      : data.totalMatchPercentage >= 50
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  }`}
                >
                  {Math.round(data.totalMatchPercentage)}%
                </div>
                <div className="text-sm text-gray-600 mt-2">Match</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Comparison */}
      <div className="mb-8 grid grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">{data.entity1Name}</h3>
          <p className="text-sm text-gray-600">Entity ID: {data.entity1Id}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">{data.entity2Name}</h3>
          <p className="text-sm text-gray-600">Entity ID: {data.entity2Id}</p>
        </div>
      </div>

      {/* Parameter Breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Parameter-by-Parameter Breakdown</h3>
        <div className="space-y-3">
          {data.parameterMatches.map((match) => {
            const weight = data.weights.find((w) => w.parameterName === match.parameterName);
            const isExpanded = expandedParameters.has(match.parameterName);

            return (
              <div key={match.parameterName} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => toggleParameter(match.parameterName)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-semibold text-gray-800">{match.parameterLabel}</p>
                        <p className="text-sm text-gray-600">
                          Type: <span className="font-medium">{match.type}</span>
                          {weight && (
                            <>
                              {' '}
                              • Weight: <span className="font-medium">{weight.weight}%</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Match Percentage Badge */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${getMatchColor(match.matchPercentage)}`}
                      >
                        {Math.round(match.matchPercentage)}%
                      </div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            match.matchPercentage >= 75
                              ? 'bg-green-500'
                              : match.matchPercentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${match.matchPercentage}%` }}
                        />
                      </div>
                    </div>
                    <ChevronDownIcon
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-4">
                      {/* Explanation */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">How it was calculated:</p>
                        <p className="text-sm text-gray-600">{match.explanation}</p>
                      </div>

                      {/* Values Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                            {data.entity1Name}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {Array.isArray(match.value1)
                              ? match.value1.join(', ')
                              : formatValue(match.value1)}
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                            {data.entity2Name}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {Array.isArray(match.value2)
                              ? match.value2.join(', ')
                              : formatValue(match.value2)}
                          </p>
                        </div>
                      </div>

                      {/* Weight Application */}
                      {weight && (
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm">
                            This parameter is weighted at{' '}
                            <span className="font-semibold">{weight.weight}%</span>, contributing{' '}
                            <span className="font-semibold">
                              {Math.round((match.matchPercentage * weight.weight) / 100)}%
                            </span>{' '}
                            to the total match.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          Calculated on {new Date(data.timestamp).toLocaleString()} • Parameters compared:{' '}
          {data.parameterMatches.length}
        </p>
      </div>
    </div>
  );
}
