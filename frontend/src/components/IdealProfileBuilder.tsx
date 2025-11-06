'use client';

import React, { useState } from 'react';

export interface IdealProfile {
  textQuery?: string;
}

export interface IdealProfileBuilderProps {
  onProfileChange: (profile: IdealProfile) => void;
  disabled?: boolean;
}

export default function IdealProfileBuilder({
  onProfileChange,
  disabled = false,
}: IdealProfileBuilderProps) {
  const [textQuery, setTextQuery] = useState('');

  const handleTextChange = (text: string) => {
    setTextQuery(text);
    onProfileChange({ textQuery: text });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Define Ideal Profile</h2>
        <p className="text-gray-600">
          Describe what you're looking for in a company.
        </p>
      </div>

      {/* Text Description */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          What are you looking for?
        </label>
        <textarea
          value={textQuery}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          placeholder='e.g., "Looking for audio equipment distributor in Germany"'
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
          rows={4}
        />
      </div>
    </div>
  );
}
