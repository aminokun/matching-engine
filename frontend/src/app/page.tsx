// app/page.tsx
"use client";

import { useState } from 'react';
import FilterPanel from '@/components/FilterPanel';
import BackendResponse from '@/components/BackendResponse';

export default function Home() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [extraRequirements, setExtraRequirements] = useState('');
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!extraRequirements.trim()) {
      setError("Please enter your requirements before searching");
      return;
    }

    setIsLoading(true);
    setError(null);
    setBackendResponse(null);

    try {
      // Transform flat filter structure into the format expected by the backend
      const filters: any = {};
      Object.entries(selectedFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          if (key === 'country') {
            filters.country = values[0]; // Backend expects single country value
          } else if (key.includes('.')) {
            // Handle nested keys like business_model.online_shop
            const [parent, child] = key.split('.');
            if (!filters[parent]) filters[parent] = {};
            filters[parent][child] = values;
          } else {
            filters[key] = values;
          }
        }
      });

      // Prepare the request data - match the backend's expected format
      const requestData = {
        query: extraRequirements,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        includeExplanations: true
      };

      // Send request to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/search`, {
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
      setBackendResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setSelectedFilters(prev => {
      const currentValues = prev[filterKey] || [];
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [filterKey]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [filterKey]: [...currentValues, value]
        };
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Finder</h1>
          <p className="text-gray-600 mt-2">Search and filter companies based on your requirements</p>
        </header>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Filters */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow p-6 h-fit">
            {/* Extra Requirements Section */}
            <div className="mb-6">
              <label htmlFor="extra-requirements" className="block text-sm font-medium text-gray-700 mb-1">
                Your Requirements
              </label>
              <textarea
                id="extra-requirements"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Describe what you're looking for in a company..."
                value={extraRequirements}
                onChange={(e) => setExtraRequirements(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Be specific about your needs to get better results
              </p>
            </div>
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-6`}
            >
              {isLoading ? 'Searching...' : 'Find Companies'}
            </button>
            
            <FilterPanel 
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          {/* Right Panel - Backend Response */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Search Results
                </h2>
              </div>
              
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Finding companies that match your requirements...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {backendResponse && !isLoading && !error && (
                <BackendResponse response={backendResponse} />
              )}
              
              {!backendResponse && !isLoading && !error && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No search performed yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your requirements and click "Find Companies" to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}