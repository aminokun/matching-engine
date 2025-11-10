'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Export company data structure (must match backend ExportCompanyData)
interface ParameterMatchResult {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number;
  value1: any;
  value2: any;
  explanation: string;
}

interface CompanyDetailsForExport {
  companyName: string;
  country?: string;
  city?: string;
  summaryOfActivity?: string;
  dateEstablished?: string;
  numberOfEmployees?: number;
  annualTurnover?: number;
  website?: string;
  linkedinPage?: string;
  telephone?: string;
  generalEmail?: string;
}

interface ClassificationForExport {
  profileType?: string;
  marketSegment?: string;
  keywords?: string[];
  servicesOffered?: string[];
  clientTypesServed?: string[];
}

interface PrimaryContactForExport {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  gender?: string;
  email?: string;
  telephone?: string;
  linkedinPage?: string;
  type?: string;
}

interface ExportCompanyDataFrontend {
  profileId: string;
  matchPercentage: number;
  companyDetails: CompanyDetailsForExport;
  classification: ClassificationForExport;
  primaryContact: PrimaryContactForExport;
  parameterMatches: ParameterMatchResult[];
  ingestionDate: string;
  source: string;
}

export interface NotionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompanies: ExportCompanyDataFrontend[];
}

export default function NotionExportDialog({
  open,
  onOpenChange,
  selectedCompanies,
}: NotionExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResults, setExportResults] = useState<Array<{
    profileId: string;
    success: boolean;
    error?: string;
  }> | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportResults(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/notion/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: selectedCompanies,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to export companies (${response.status})`);
      }

      const result = await response.json();

      // Build results array for display
      const results = result.results.map((r: any) => ({
        profileId: r.profileId,
        success: !!r.pageId,
        error: r.error,
      }));

      setExportResults(results);
      setIsExporting(false);
      setExportComplete(true);

      // Auto-close dialog after 3 seconds if all successful
      if (result.failed === 0) {
        setTimeout(() => {
          setExportComplete(false);
          setExportResults(null);
          onOpenChange(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export companies');
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      setExportComplete(false);
      setExportError(null);
      setExportResults(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close Button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none" disabled={isExporting}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="space-y-6">
            {/* Export Complete - Success State */}
            {exportComplete && exportResults && exportError === null ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 text-center">Export Successful!</h2>
                  <p className="text-sm text-gray-900 text-center mt-2">
                    {exportResults.filter(r => r.success).length} of {exportResults.length} compan{exportResults.length === 1 ? 'y' : 'ies'} exported to Notion
                  </p>
                </div>

                {/* Show any individual failures */}
                {exportResults.some(r => !r.success) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-900">Failed to export:</p>
                    {exportResults.filter(r => !r.success).map((result) => (
                      <div key={result.profileId} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <p className="text-red-700">{result.profileId}: {result.error}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : exportError ? (
              /* Error State */
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 text-center">Export Failed</h2>
                  <p className="text-sm text-gray-900 text-center mt-2">
                    {exportError}
                  </p>
                </div>

                {/* Actions for error state */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Initial state - before export */
              <>
                {/* Header */}
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Export to Notion
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-900 mt-1">
                    Review the companies you're about to export to your Notion workspace
                  </Dialog.Description>
                </div>

                {/* Company List */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900 mb-3">
                    Selected Companies ({selectedCompanies.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCompanies.map((company) => (
                      <div
                        key={company.profileId}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {company.companyDetails.companyName}
                          </p>
                          <p className="text-xs text-gray-900 mt-1">{company.profileId}</p>
                        </div>
                        <div className="ml-4 text-right flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                            {Math.round(company.matchPercentage)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Message */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Note:</span> These companies will be added as new pages in your Notion export database with full details including match breakdowns.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      'Export to Notion'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
