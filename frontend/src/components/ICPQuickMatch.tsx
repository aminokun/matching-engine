'use client';

import React, { useState } from 'react';
import { SearchIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { QuickMatchRequest } from '../types';

interface CriteriaField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'array';
  placeholder: string;
  scoringType: 'geographic' | 'categorical' | 'semantic' | 'numeric' | 'exact';
  defaultValue?: string;
}

const AVAILABLE_FIELDS: CriteriaField[] = [
  {
    name: 'country',
    label: 'Country',
    type: 'text',
    placeholder: 'e.g., Netherlands',
    scoringType: 'geographic',
  },
  {
    name: 'city',
    label: 'City',
    type: 'text',
    placeholder: 'e.g., Amsterdam',
    scoringType: 'geographic',
  },
  {
    name: 'profileType',
    label: 'Profile Type',
    type: 'text',
    placeholder: 'e.g., Distributor',
    scoringType: 'categorical',
  },
  {
    name: 'marketSegment',
    label: 'Market Segment',
    type: 'text',
    placeholder: 'e.g., mid-market',
    scoringType: 'categorical',
  },
  {
    name: 'keywords',
    label: 'Keywords',
    type: 'array',
    placeholder: 'e.g., tech, audio (comma separated)',
    scoringType: 'semantic',
  },
  {
    name: 'numberOfEmployees',
    label: 'Number of Employees',
    type: 'number',
    placeholder: 'e.g., 100',
    scoringType: 'numeric',
  },
  {
    name: 'annualTurnover',
    label: 'Annual Turnover',
    type: 'number',
    placeholder: 'e.g., 1000000',
    scoringType: 'numeric',
  },
];

interface CriterionInput {
  field: string;
  value: string;
  weight: number;
}

export interface ICPQuickMatchProps {
  onSearch: (request: QuickMatchRequest) => void;
  isLoading?: boolean;
}

export default function ICPQuickMatch({ onSearch, isLoading }: ICPQuickMatchProps) {
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { field: 'country', value: '', weight: 8 },
  ]);
  const [minThreshold, setMinThreshold] = useState(30);

  // Add a new criterion
  const addCriterion = () => {
    const usedFields = criteria.map((c) => c.field);
    const availableField = AVAILABLE_FIELDS.find((f) => !usedFields.includes(f.name));
    if (availableField) {
      setCriteria([...criteria, { field: availableField.name, value: '', weight: 5 }]);
    }
  };

  // Remove a criterion
  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  // Update a criterion
  const updateCriterion = (index: number, updates: Partial<CriterionInput>) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], ...updates };
    setCriteria(updated);
  };

  // Handle search
  const handleSearch = () => {
    const request: QuickMatchRequest = {
      criteria: {},
      weights: {},
      minThreshold,
      maxResults: 50,
    };

    criteria.forEach((c) => {
      const fieldInfo = AVAILABLE_FIELDS.find((f) => f.name === c.field);
      if (!fieldInfo) return;

      // Parse value based on type
      let parsedValue: any = c.value;
      if (fieldInfo.type === 'number') {
        parsedValue = parseFloat(c.value) || 0;
      } else if (fieldInfo.type === 'array') {
        parsedValue = c.value.split(',').map((v) => v.trim()).filter(Boolean);
      }

      request.criteria[c.field] = parsedValue;
      request.weights = request.weights || {};
      request.weights[c.field] = c.weight;
    });

    onSearch(request);
  };

  // Get field info for a criterion
  const getFieldInfo = (fieldName: string) => {
    return AVAILABLE_FIELDS.find((f) => f.name === fieldName);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Quick Match</h2>
          <p className="text-sm text-gray-600">Define criteria to find matching companies</p>
        </div>
      </div>

      {/* Criteria List */}
      <div className="space-y-3">
        {criteria.map((criterion, index) => {
          const fieldInfo = getFieldInfo(criterion.field);
          if (!fieldInfo) return null;

          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              {/* Remove Button */}
              {criteria.length > 1 && (
                <button
                  onClick={() => removeCriterion(index)}
                  className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2Icon size={16} />
                </button>
              )}

              {/* Field Name */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {fieldInfo.label}
                  <span className="text-gray-400 ml-1">({fieldInfo.scoringType})</span>
                </label>
                <input
                  type={fieldInfo.type === 'number' ? 'number' : 'text'}
                  placeholder={fieldInfo.placeholder}
                  value={criterion.value}
                  onChange={(e) => updateCriterion(index, { value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Weight Slider */}
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Weight: {criterion.weight}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={criterion.weight}
                  onChange={(e) => updateCriterion(index, { weight: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Criterion Button */}
      {criteria.length < AVAILABLE_FIELDS.length && (
        <button
          onClick={addCriterion}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <PlusIcon size={16} />
          Add Criterion
        </button>
      )}

      {/* Threshold and Search */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Min Threshold: {minThreshold}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={minThreshold}
            onChange={(e) => setMinThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading || criteria.some((c) => !c.value)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <SearchIcon size={18} />
          {isLoading ? 'Searching...' : 'Find Matches'}
        </button>
      </div>
    </div>
  );
}
