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

export interface SingleEntitySelectorProps {
  onSelect: (entityId: string) => void;
  loading?: boolean;
  error?: string;
}

export default function SingleEntitySelector({
  onSelect,
  loading = false,
}: SingleEntitySelectorProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityId, setEntityId] = useState<string>("");
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch entities on mount
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      setErrorMessage("");
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/entities?limit=100`);
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

  // Trigger parent callback when entity is selected
  useEffect(() => {
    if (entityId) {
      onSelect(entityId);
    }
  }, [entityId, onSelect]);

  const selectedEntity = entities.find((e) => e.profileId === entityId);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Select a Company
        </h2>
        <p className="text-gray-600">
          Choose a company from the database to find matches for.
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Company
            </label>
            <Select.Root value={entityId} onValueChange={setEntityId}>
              <Select.Trigger
                disabled={loading}
                className="inline-flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50  disabled:cursor-not-allowed"
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
                        className="flex items-center text-gray-800 px-3 py-2 text-sm rounded hover:bg-blue-50 hover:text-blue-900 data-[highlighted]:bg-blue-100 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed cursor-pointer"
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

            {selectedEntity && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-900">
                  {selectedEntity.companyName}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-blue-800">
                  <p>Country: {selectedEntity.country}</p>
                  <p>City: {selectedEntity.city}</p>
                  <p>Type: {selectedEntity.profileType}</p>
                  <p>Segment: {selectedEntity.marketSegment}</p>
                  <p>Employees: {selectedEntity.numberOfEmployees}</p>
                  <p>
                    Turnover: $
                    {(selectedEntity.annualTurnover / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            )}
          </div>

          {entityId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ Ready to define ideal profile
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
