'use client';

import React, { useState, useEffect } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import { CheckIcon } from 'lucide-react';

export interface Parameter {
  name: string;
  label: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
}

export interface ParameterWeight {
  parameterName: string;
  weight: number;
}

export interface WeightAllocatorProps {
  parameters: Parameter[];
  onWeightsChange: (weights: ParameterWeight[]) => void;
  disabled?: boolean;
}

export default function WeightAllocator({
  parameters,
  onWeightsChange,
  disabled = false,
}: WeightAllocatorProps) {
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(new Set());
  const [weights, setWeights] = useState<Map<string, number>>(new Map());
  const [totalWeight, setTotalWeight] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize weights for all parameters
  useEffect(() => {
    const initialWeights = new Map<string, number>();
    parameters.forEach((param) => {
      initialWeights.set(param.name, 0);
    });
    setWeights(initialWeights);
  }, [parameters]);

  // Handle parameter selection
  const handleParameterToggle = (parameterName: string, checked: boolean) => {
    const newSelected = new Set(selectedParameters);
    if (checked) {
      newSelected.add(parameterName);
      // Initialize with equal weight
      const currentSelected = newSelected.size;
      const equalWeight = Math.round(100 / currentSelected);
      const newWeights = new Map(weights);

      newSelected.forEach((name) => {
        newWeights.set(name, equalWeight);
      });
      setWeights(newWeights);
      setSelectedParameters(newSelected);
      validateAndNotify(newWeights, newSelected);
    } else {
      newSelected.delete(parameterName);
      const newWeights = new Map(weights);
      newWeights.set(parameterName, 0);
      setWeights(newWeights);
      setSelectedParameters(newSelected);
      validateAndNotify(newWeights, newSelected);
    }
  };

  // Handle weight slider change
  const handleWeightChange = (parameterName: string, newWeight: number) => {
    const newWeights = new Map(weights);
    newWeights.set(parameterName, newWeight);
    setWeights(newWeights);
    validateAndNotify(newWeights, selectedParameters);
  };

  // Validate weights and notify parent
  const validateAndNotify = (
    currentWeights: Map<string, number>,
    currentSelected: Set<string>
  ) => {
    const selectedWeights = Array.from(currentSelected).map((name) => ({
      parameterName: name,
      weight: currentWeights.get(name) || 0,
    }));

    const total = selectedWeights.reduce((sum, w) => sum + w.weight, 0);
    setTotalWeight(total);

    const newErrors: string[] = [];
    if (currentSelected.size === 0) {
      newErrors.push('Select at least one parameter');
    }
    if (Math.abs(total - 100) > 0.01) {
      newErrors.push(`Weights must sum to 100% (currently ${total}%)`);
    }

    setErrors(newErrors);

    // Only notify parent if valid
    if (newErrors.length === 0) {
      onWeightsChange(selectedWeights);
    }
  };

  // Auto-balance weights when selection changes
  const handleAutoBalance = () => {
    if (selectedParameters.size === 0) return;

    const equalWeight = 100 / selectedParameters.size;
    const newWeights = new Map(weights);

    selectedParameters.forEach((name) => {
      newWeights.set(name, Math.round(equalWeight * 100) / 100);
    });

    setWeights(newWeights);
    validateAndNotify(newWeights, selectedParameters);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Weight Allocation</h2>
        <p className="text-gray-600">
          Select parameters that matter for matching and set their importance weights.
        </p>
      </div>

      {/* Parameter Selection Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Step 1: Select Parameters</h3>
        <div className="grid grid-cols-1 gap-3">
          {parameters.map((param) => (
            <div key={param.name} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded">
              <Checkbox.Root
                id={param.name}
                checked={selectedParameters.has(param.name)}
                onCheckedChange={(checked) =>
                  handleParameterToggle(param.name, checked as boolean)
                }
                disabled={disabled}
                className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Checkbox.Indicator className="text-blue-600">
                  <CheckIcon size={16} />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor={param.name}
                className="flex-1 cursor-pointer text-sm font-medium text-gray-700"
              >
                {param.label}
                <span className="ml-2 text-xs text-gray-500">({param.type})</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Allocation Section */}
      {selectedParameters.size > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Step 2: Allocate Weights</h3>
            <button
              onClick={handleAutoBalance}
              disabled={disabled}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Auto Balance
            </button>
          </div>

          <div className="space-y-6">
            {Array.from(selectedParameters).map((paramName) => {
              const param = parameters.find((p) => p.name === paramName);
              const currentWeight = weights.get(paramName) || 0;

              return (
                <div key={paramName} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">
                      {param?.label}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(currentWeight)}
                        onChange={(e) => {
                          const newValue = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          handleWeightChange(paramName, newValue);
                        }}
                        disabled={disabled}
                        className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                  <Slider.Root
                    value={[currentWeight]}
                    onValueChange={(value) => handleWeightChange(paramName, value[0])}
                    min={0}
                    max={100}
                    step={1}
                    disabled={disabled}
                    className="flex items-center cursor-pointer"
                  >
                    <Slider.Track className="relative flex-1 h-2 bg-gray-200 rounded">
                      <Slider.Range className="absolute h-full bg-blue-500 rounded" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block h-5 w-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 disabled:opacity-50"
                      aria-label={`Weight for ${param?.label}`}
                    />
                  </Slider.Root>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total Weight Display */}
      {selectedParameters.size > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Total Weight</span>
            <span
              className={`text-lg font-bold ${
                Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {Math.round(totalWeight)}%
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                Math.abs(totalWeight - 100) < 0.01 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Configuration Errors:</p>
          <ul className="mt-2 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-600">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success State */}
      {errors.length === 0 && selectedParameters.size > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">✓ Ready to match with these weights</p>
        </div>
      )}
    </div>
  );
}
