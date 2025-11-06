'use client';

import React, { useState, useEffect } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import { CheckIcon } from 'lucide-react';

export interface Parameter {
  name: string;
  label: string;
  type?: string;
  databaseName?: string; // The Notion database this parameter came from
}

export interface ParameterWeight {
  parameterName: string;
  weight: number;
  value?: string; // The actual parameter value (for Notion parameters)
  type?: string; // 'notion' or undefined for elasticsearch parameters
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
  const [priorities, setPriorities] = useState<Map<string, number>>(new Map());
  const [totalPriority, setTotalPriority] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize priorities for all parameters
  useEffect(() => {
    const initialPriorities = new Map<string, number>();
    parameters.forEach((param) => {
      initialPriorities.set(param.name, 1);
    });
    setPriorities(initialPriorities);
  }, [parameters]);

  // Handle parameter selection
  const handleParameterToggle = (parameterName: string, checked: boolean) => {
    const newSelected = new Set(selectedParameters);
    const newPriorities = new Map(priorities);

    if (checked) {
      newSelected.add(parameterName);
      newPriorities.set(parameterName, 1); // Default priority
    } else {
      newSelected.delete(parameterName);
      newPriorities.set(parameterName, 0);
    }

    setSelectedParameters(newSelected);
    setPriorities(newPriorities);
    validateAndNotify(newPriorities, newSelected);
  };

  // Handle priority slider change
  const handlePriorityChange = (parameterName: string, newPriority: number) => {
    const newPriorities = new Map(priorities);
    newPriorities.set(parameterName, newPriority);
    setPriorities(newPriorities);
    validateAndNotify(newPriorities, selectedParameters);
  };

  // Validate and notify parent
  const validateAndNotify = (
    currentPriorities: Map<string, number>,
    currentSelected: Set<string>
  ) => {
    const selectedWeights = Array.from(currentSelected).map((name) => {
      const param = parameters.find((p) => p.name === name);
      const weight: any = {
        parameterName: name,
        weight: currentPriorities.get(name) || 1,
      };

      // Include type and value for Notion parameters
      if (param?.type === 'notion') {
        weight.type = 'notion';
        weight.value = param.label; // Use the label directly as the parameter value
      }

      return weight;
    });

    const total = selectedWeights.reduce((sum, w) => sum + w.weight, 0);
    setTotalPriority(total);

    const newErrors: string[] = [];
    if (currentSelected.size === 0) {
      newErrors.push('Select at least one parameter');
    }

    setErrors(newErrors);

    // Only notify parent if valid
    if (newErrors.length === 0) {
      onWeightsChange(selectedWeights);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Allocate Priorities</h2>
        <p className="text-slate-800">
          Select parameters and set their importance (1-5, where 5 is most important).
        </p>
      </div>

      {/* Parameter Selection Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Step 1: Select Parameters</h3>
        <div className="max-h-64 overflow-y-auto space-y-4">
          {/* Group parameters by database */}
          {Array.from(new Set(parameters.map((p) => p.databaseName || 'Other'))).map((dbName) => {
            const dbParams = parameters.filter((p) => (p.databaseName || 'Other') === dbName);
            return (
              <div key={dbName}>
                {dbParams.length > 0 && (
                  <h4 className="text-sm font-semibold text-slate-800 mb-2 px-3">{dbName}</h4>
                )}
                <div className="space-y-2 pl-2">
                  {dbParams.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded"
                    >
                      <Checkbox.Root
                        id={p.name}
                        checked={selectedParameters.has(p.name)}
                        onCheckedChange={(checked) =>
                          handleParameterToggle(p.name, checked as boolean)
                        }
                        disabled={disabled}
                        className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Checkbox.Indicator className="text-blue-600">
                          <CheckIcon size={16} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <label
                        htmlFor={p.name}
                        className="flex-1 cursor-pointer text-sm font-medium text-slate-800"
                      >
                        {p.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Allocation Section */}
      {selectedParameters.size > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Step 2: Set Priorities</h3>
          <div className="space-y-6">
            {Array.from(selectedParameters).map((paramName) => {
              const param = parameters.find((p) => p.name === paramName);
              const currentPriority = priorities.get(paramName) || 1;

              return (
                <div key={paramName} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-800">
                      {param?.label}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="1"
                        value={currentPriority}
                        onChange={(e) => {
                          const newValue = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                          handlePriorityChange(paramName, newValue);
                        }}
                        disabled={disabled}
                        className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm disabled:opacity-50"
                      />
                      <span className="text-sm text-slate-800 w-8">/ 5</span>
                    </div>
                  </div>
                  <Slider.Root
                    value={[currentPriority]}
                    onValueChange={(value) => handlePriorityChange(paramName, value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={disabled}
                    className="flex items-center cursor-pointer"
                  >
                    <Slider.Track className="relative flex-1 h-2 bg-gray-200 rounded">
                      <Slider.Range className="absolute h-full bg-blue-500 rounded" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block h-5 w-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 disabled:opacity-50"
                      aria-label={`Priority for ${param?.label}`}
                    />
                  </Slider.Root>
                  <div className="text-xs text-slate-800 flex justify-between">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total Priority Display */}
      {selectedParameters.size > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-800">Total Priority Score</span>
            <span className="text-lg font-bold text-blue-600">{totalPriority}</span>
          </div>
          <p className="text-xs text-slate-800 mt-2">
            Higher values indicate more important parameters in matching.
          </p>
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
          <p className="text-sm text-green-700 font-medium">✓ Ready to match with these priorities</p>
        </div>
      )}
    </div>
  );
}
