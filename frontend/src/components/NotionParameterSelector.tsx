'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';

export interface NotionDatabase {
  id: string;
  name: string;
  icon?: string;
}

export interface SelectedDatabase {
  id: string;
  name: string;
  parameters: Array<{
    id: string;
    name: string;
    value?: string;
    type?: string;
    description?: string;
  }>;
}

export interface NotionParameterSelectorProps {
  onParametersChange: (selectedDatabases: SelectedDatabase[]) => void;
}

export default function NotionParameterSelector({ onParametersChange }: NotionParameterSelectorProps) {
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabases, setSelectedDatabases] = useState<SelectedDatabase[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available Notion databases on mount
  useEffect(() => {
    const fetchDatabases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/notion/databases`);

        if (!response.ok) {
          throw new Error('Failed to fetch Notion databases');
        }

        const data = await response.json();
        setDatabases(data.databases || []);

        if (data.databases?.length === 0) {
          setError('No Notion databases found. Make sure NOTION_API_KEY is configured in the backend.');
        }
      } catch (err) {
        console.error('Failed to fetch databases:', err);
        setError('Could not connect to Notion. Please configure NOTION_API_KEY in backend environment.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabases();
  }, []);

  const handleAddDatabase = async (database: NotionDatabase) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/notion/database/${database.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch database content');
      }

      const data = await response.json();

      const newSelected: SelectedDatabase = {
        id: database.id,
        name: database.name,
        parameters: data.parameters || [],
      };

      // Add to existing selections (allow multiple databases)
      setSelectedDatabases((prev) => [...prev, newSelected]);
      onParametersChange([...selectedDatabases, newSelected]);
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Failed to add database:', err);
      setError('Failed to load database content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDatabase = (databaseId: string) => {
    const updated = selectedDatabases.filter((db) => db.id !== databaseId);
    setSelectedDatabases(updated);
    onParametersChange(updated);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Parameter Sets (From Notion)</h3>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading || databases.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            Add Parameter Set
            <ChevronDown size={16} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {databases.length === 0 ? (
                <div className="p-4 text-sm text-gray-600 text-center">
                  No databases available
                </div>
              ) : (
                databases.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => handleAddDatabase(db)}
                    disabled={selectedDatabases.some((s) => s.id === db.id)}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b last:border-b-0 ${
                      selectedDatabases.some((s) => s.id === db.id) ? 'bg-gray-50' : ''
                    }`}
                  >
                    {db.icon && <span className="text-lg">{db.icon}</span>}
                    <span className="flex-1">{db.name}</span>
                    {selectedDatabases.some((s) => s.id === db.id) && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Added</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          {error}
        </div>
      )}

      {/* Selected Databases */}
      {selectedDatabases.length > 0 ? (
        <div className="space-y-2">
          {selectedDatabases.map((db) => (
            <div
              key={db.id}
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-blue-900">{db.name}</p>
                <p className="text-xs text-blue-700">
                  {db.parameters.length} {db.parameters.length === 1 ? 'option' : 'options'}
                </p>
              </div>
              <button
                onClick={() => handleRemoveDatabase(db.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove parameter set"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200 text-center">
          No parameter sets selected yet. Click "Add Parameter Set" to get started.
        </div>
      )}

      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
}
