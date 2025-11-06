"use client";

import React, { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "lucide-react";

export interface Entity {
  profileId: string;
  companyName: string;
  country: string;
  city: string;
  profileType: string;
  marketSegment: string;
  numberOfEmployees: number;
  annualTurnover: number;
}

export interface EntitySelectorProps {
  onSelect: (entity1Id: string, entity2Id: string) => void;
  loading?: boolean;
  error?: string;
}

export default function EntitySelector({
  onSelect,
  loading = false,
}: EntitySelectorProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entity1, setEntity1] = useState<string>("");
  const [entity2, setEntity2] = useState<string>("");
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch entities on mount
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      setErrorMessage("");
      try {
        const response = await fetch(
          "http://localhost:3001/api/entities?limit=100"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch entities");
        }
        const data = await response.json();
        setEntities(data.entities || []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to fetch entities"
        );
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, []);

  // Trigger parent callback when both entities are selected
  useEffect(() => {
    if (entity1 && entity2 && entity1 !== entity2) {
      onSelect(entity1, entity2);
    }
  }, [entity1, entity2, onSelect]);

  const selectedEntity1 = entities.find((e) => e.profileId === entity1);
  const selectedEntity2 = entities.find((e) => e.profileId === entity2);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Companies to Compare</h2>
        <p className="text-gray-600">
          Choose two companies from the database to calculate match percentage.
        </p>
      </div>

      {errorMessage && !loadingEntities && entities.length === 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {loadingEntities && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Loading companies...</p>
        </div>
      )}

      {!loadingEntities && entities.length > 0 && (
        <div className="space-y-8">
          {/* Entity 1 Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Company 1
            </label>
            <Select.Root value={entity1} onValueChange={setEntity1}>
              <Select.Trigger
                disabled={loading}
                className="inline-flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg disabled:cursor-not-allowed"
                
              >
                <Select.Value
                  placeholder="Select a company..."
                  className="text-gray-700"
                />
                <ChevronDownIcon size={20} className="text-gray-500" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-lg border border-gray-300 shadow-lg z-50">
                  <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-50 text-gray-600">
                    ↑
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-2 max-h-64 overflow-y-auto">
                    {entities.map((entity) => (
                      <Select.Item
                        key={entity.profileId}
                        value={entity.profileId}
                        disabled={entity.profileId === entity2}
                        className="flex items-center px-3 py-2 text-sm rounded hover:bg-blue-50 hover:text-blue-900 data-[highlighted]:bg-blue-100 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed cursor-pointer"
                      >
                        <Select.ItemText>{entity.companyName}</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <CheckIcon size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-50 text-gray-600">
                    ↓
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {selectedEntity1 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-900">
                  {selectedEntity1.companyName}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-blue-800">
                  <p>Country: {selectedEntity1.country}</p>
                  <p>City: {selectedEntity1.city}</p>
                  <p>Type: {selectedEntity1.profileType}</p>
                  <p>Segment: {selectedEntity1.marketSegment}</p>
                  <p>Employees: {selectedEntity1.numberOfEmployees}</p>
                  <p>
                    Turnover: $
                    {(selectedEntity1.annualTurnover / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Entity 2 Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Company 2
            </label>
            <Select.Root value={entity2} onValueChange={setEntity2}>
              <Select.Trigger
                disabled={loading}
                className="inline-flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                <Select.Value
                  placeholder="Select a company..."
                  className="text-gray-700"
                />
                <ChevronDownIcon size={20} className="text-gray-500" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white rounded-lg border border-gray-300 shadow-lg z-50">
                  <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-50 text-gray-600">
                    ↑
                  </Select.ScrollUpButton>
                  <Select.Viewport className="p-2 max-h-64 overflow-y-auto">
                    {entities.map((entity) => (
                      <Select.Item
                        key={entity.profileId}
                        value={entity.profileId}
                        disabled={entity.profileId === entity1}
                        className="flex items-center px-3 py-2 text-sm rounded hover:bg-blue-50 hover:text-blue-900 data-[highlighted]:bg-blue-100 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed cursor-pointer"
                      >
                        <Select.ItemText>{entity.companyName}</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto">
                          <CheckIcon size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-50 text-gray-600">
                    ↓
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {selectedEntity2 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-900">
                  {selectedEntity2.companyName}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-blue-800">
                  <p>Country: {selectedEntity2.country}</p>
                  <p>City: {selectedEntity2.city}</p>
                  <p>Type: {selectedEntity2.profileType}</p>
                  <p>Segment: {selectedEntity2.marketSegment}</p>
                  <p>Employees: {selectedEntity2.numberOfEmployees}</p>
                  <p>
                    Turnover: $
                    {(selectedEntity2.annualTurnover / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selection Status */}
          {entity1 && entity2 && entity1 !== entity2 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ Ready to calculate match
              </p>
            </div>
          )}

          {entity1 === entity2 && entity1 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Select two different companies
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
