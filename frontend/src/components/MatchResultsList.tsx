'use client';

import React, { useState, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Checkbox from '@radix-ui/react-checkbox';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

export interface ParameterMatch {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number;
  value1: string | number | string[];
  value2: string | number | string[];
  explanation: string;
}

export interface SearchMatchResult {
  entity: {
    profileId: string;
    companyDetails: {
      companyName: string;
      country: string;
      city: string;
      numberOfEmployees: number;
      annualTurnover: number;
    };
    classification: {
      profileType: string;
      marketSegment: string;
      keywords: string[];
    };
  };
  matchPercentage: number;
  parameterMatches: ParameterMatch[];
  rank: number;
}

export interface SearchMatchesResponse {
  totalMatches: number;
  matchesAboveThreshold: number;
  threshold: number;
  matches: SearchMatchResult[];
}

export interface MatchResultsListProps {
  data: SearchMatchesResponse;
  onSelectionsChange?: (selectedIds: string[]) => void;
}

export default function MatchResultsList({ data, onSelectionsChange }: MatchResultsListProps) {
  const [threshold, setThreshold] = useState(data.threshold || 0);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  // Filter matches based on threshold
  const filteredMatches = useMemo(() => {
    return data.matches.filter((match) => match.matchPercentage >= threshold);
  }, [data.matches, threshold]);

  // Handle threshold change
  const handleThresholdChange = (newThreshold: number[]) => {
    setThreshold(newThreshold[0]);
  };

  // Toggle match expansion
  const toggleMatchExpansion = (matchId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  // Toggle match selection
  const toggleMatchSelection = (profileId: string) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedMatches(newSelected);
    onSelectionsChange?.(Array.from(newSelected));
  };

  // Toggle all matches
  const toggleAllMatches = () => {
    if (selectedMatches.size === filteredMatches.length) {
      setSelectedMatches(new Set());
      onSelectionsChange?.([]);
    } else {
      const allIds = new Set(filteredMatches.map((m) => m.entity.profileId));
      setSelectedMatches(allIds);
      onSelectionsChange?.(Array.from(allIds));
    }
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

  const formatValue = (value: string | number | string[]): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'number' && value > 1000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return String(value);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Match Results</h2>
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold">{data.totalMatches}</span> candidates,{' '}
          <span className="font-semibold">{filteredMatches.length}</span> above{' '}
          <span className="font-semibold">{threshold}%</span> threshold
        </p>
      </div>

      {/* Threshold Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Match Threshold</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={Math.round(threshold)}
              onChange={(e) => setThreshold(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>
        <Slider.Root
          value={[threshold]}
          onValueChange={handleThresholdChange}
          min={0}
          max={100}
          step={1}
          className="flex items-center cursor-pointer"
        >
          <Slider.Track className="relative flex-1 h-2 bg-gray-200 rounded">
            <Slider.Range className="absolute h-full bg-blue-500 rounded" />
          </Slider.Track>
          <Slider.Thumb
            className="block h-5 w-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50"
            aria-label="Match threshold"
          />
        </Slider.Root>
      </div>

      {/* Selection Header */}
      {filteredMatches.length > 0 && (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Checkbox.Root
            checked={selectedMatches.size === filteredMatches.length && filteredMatches.length > 0}
            onCheckedChange={toggleAllMatches}
            className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50"
          >
            <Checkbox.Indicator className="text-blue-600">
              <CheckIcon size={16} />
            </Checkbox.Indicator>
          </Checkbox.Root>
          <span className="text-sm font-medium text-gray-700">
            {selectedMatches.size > 0 ? `${selectedMatches.size} selected` : 'Select matches to export'}
          </span>
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => {
            const isExpanded = expandedMatches.has(match.entity.profileId);
            const isSelected = selectedMatches.has(match.entity.profileId);

            return (
              <div key={match.entity.profileId} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Match Row */}
                <div className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  {/* Checkbox */}
                  <Checkbox.Root
                    checked={isSelected}
                    onCheckedChange={() => toggleMatchSelection(match.entity.profileId)}
                    className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 flex-shrink-0"
                  >
                    <Checkbox.Indicator className="text-blue-600">
                      <CheckIcon size={16} />
                    </Checkbox.Indicator>
                  </Checkbox.Root>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      #{match.rank} - {match.entity.companyDetails.companyName}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-600">
                      <p>Country: {match.entity.companyDetails.country}</p>
                      <p>Type: {match.entity.classification.profileType}</p>
                      <p>City: {match.entity.companyDetails.city}</p>
                      <p>Segment: {match.entity.classification.marketSegment}</p>
                    </div>
                  </div>

                  {/* Match Percentage */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getMatchColor(match.matchPercentage)}`}>
                        {Math.round(match.matchPercentage)}%
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
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
                    <button
                      onClick={() => toggleMatchExpansion(match.entity.profileId)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    >
                      <ChevronDownIcon
                        size={20}
                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Parameter Breakdown</h4>
                      <div className="space-y-2">
                        {match.parameterMatches.map((param) => (
                          <div key={param.parameterName} className="p-3 bg-white rounded border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{param.parameterLabel}</p>
                                <p className="text-xs text-gray-600">{param.explanation}</p>
                              </div>
                              <div className={`text-lg font-bold ${getMatchColor(param.matchPercentage)}`}>
                                {Math.round(param.matchPercentage)}%
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                Search: {formatValue(param.value1)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                Company: {formatValue(param.value2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">Try lowering the threshold to see more results.</p>
          </div>
        )}
      </div>

      {/* Export Info */}
      {selectedMatches.size > 0 && (
        <div className={`p-4 rounded-lg border ${getMatchBgColor(75)}`}>
          <p className="text-sm font-medium text-gray-800">
            {selectedMatches.size} company selected for export
            {selectedMatches.size > 1 ? 'ies' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
