'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

export interface NotionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCompanies: Array<{
    profileId: string;
    companyName: string;
    matchPercentage: number;
  }>;
}

export default function NotionExportDialog({
  open,
  onOpenChange,
  selectedCompanies,
}: NotionExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Log for debugging
    console.log('Exporting to Notion:', {
      timestamp: new Date().toISOString(),
      count: selectedCompanies.length,
      companies: selectedCompanies.map((c) => ({
        profileId: c.profileId,
        companyName: c.companyName,
        matchPercentage: c.matchPercentage,
      })),
    });

    setIsExporting(false);
    setExportComplete(true);

    // Auto-close dialog after 2 seconds
    setTimeout(() => {
      setExportComplete(false);
      onOpenChange(false);
    }, 2000);
  };

  const handleClose = () => {
    if (!isExporting) {
      setExportComplete(false);
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
            {/* Success State */}
            {exportComplete ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 text-center">Export Successful!</h2>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {selectedCompanies.length} compan{selectedCompanies.length === 1 ? 'y' : 'ies'} queued for Notion
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Export to Notion
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600 mt-1">
                    Review the companies you're about to export
                  </Dialog.Description>
                </div>

                {/* Company List */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Selected Companies ({selectedCompanies.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCompanies.map((company) => (
                      <div
                        key={company.profileId}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {company.companyName}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{company.profileId}</p>
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
                    <span className="font-semibold">Note:</span> These companies will be sent to your Notion workspace
                    for further investigation.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleClose}
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
