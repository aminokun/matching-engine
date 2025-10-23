'use client';

import React, { useState } from 'react';

export interface IdealProfile {
  textQuery?: string;
  country?: string;
  profileType?: string;
  marketSegment?: string;
  keywords?: string[];
}

export interface IdealProfileBuilderProps {
  onProfileChange: (profile: IdealProfile) => void;
  disabled?: boolean;
}

const PROFILE_TYPES = [
  'Distributor',
  'Manufacturer',
  'Wholesaler',
  'Retailer',
  'Installer',
];

const MARKET_SEGMENTS = ['small-business', 'mid-market', 'enterprise'];

const KEYWORD_SUGGESTIONS = [
  'audio',
  'sound',
  'lighting',
  'AV equipment',
  'event technology',
  'professional',
  'B2B',
  'distribution',
  'wholesale',
  'retail',
];

const COUNTRIES = [
  'Germany',
  'China',
  'Hong Kong',
  'France',
  'Netherlands',
  'Spain',
  'United Kingdom',
  'Austria',
  'Belgium',
  'Italy',
];

export default function IdealProfileBuilder({
  onProfileChange,
  disabled = false,
}: IdealProfileBuilderProps) {
  const [profile, setProfile] = useState<IdealProfile>({});
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');

  const handleTextChange = (text: string) => {
    const updated = { ...profile, textQuery: text };
    setProfile(updated);
    onProfileChange(updated);
  };

  const handleCountryChange = (country: string) => {
    const updated = { ...profile, country: country || undefined };
    setProfile(updated);
    onProfileChange(updated);
  };

  const handleProfileTypeChange = (type: string) => {
    const updated = { ...profile, profileType: type || undefined };
    setProfile(updated);
    onProfileChange(updated);
  };

  const handleMarketSegmentChange = (segment: string) => {
    const updated = { ...profile, marketSegment: segment || undefined };
    setProfile(updated);
    onProfileChange(updated);
  };

  const handleKeywordToggle = (keyword: string) => {
    const updated = selectedKeywords.includes(keyword)
      ? selectedKeywords.filter((k) => k !== keyword)
      : [...selectedKeywords, keyword];

    setSelectedKeywords(updated);
    const newProfile = { ...profile, keywords: updated };
    setProfile(newProfile);
    onProfileChange(newProfile);
  };

  const handleAddCustomKeyword = () => {
    if (customKeyword.trim() && !selectedKeywords.includes(customKeyword.trim())) {
      const updated = [...selectedKeywords, customKeyword.trim()];
      setSelectedKeywords(updated);
      setCustomKeyword('');
      const newProfile = { ...profile, keywords: updated };
      setProfile(newProfile);
      onProfileChange(newProfile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Define Ideal Profile</h2>
        <p className="text-gray-600">
          Describe what you're looking for in a company using text and filters.
        </p>
      </div>

      {/* Free Text Description */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          What are you looking for?
        </label>
        <textarea
          value={profile.textQuery || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., 'Distributor in China for audio equipment' or 'Manufacturer of LED lighting in Europe'"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
          rows={3}
        />
      </div>

      {/* Country Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Country (Optional)
        </label>
        <select
          value={profile.country || ''}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
        >
          <option value="">-- Any Country --</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* Profile Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Company Type (Optional)
        </label>
        <select
          value={profile.profileType || ''}
          onChange={(e) => handleProfileTypeChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
        >
          <option value="">-- Any Type --</option>
          {PROFILE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Market Segment Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Market Segment (Optional)
        </label>
        <select
          value={profile.marketSegment || ''}
          onChange={(e) => handleMarketSegmentChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
        >
          <option value="">-- Any Segment --</option>
          {MARKET_SEGMENTS.map((segment) => (
            <option key={segment} value={segment}>
              {segment}
            </option>
          ))}
        </select>
      </div>

      {/* Keywords Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Keywords/Industry Focus (Optional)
        </label>

        {/* Suggested Keywords */}
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Suggested keywords:</p>
          <div className="flex flex-wrap gap-2">
            {KEYWORD_SUGGESTIONS.map((keyword) => (
              <button
                key={keyword}
                onClick={() => !disabled && handleKeywordToggle(keyword)}
                disabled={disabled}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedKeywords.includes(keyword)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Keyword Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !disabled && handleAddCustomKeyword()}
            disabled={disabled}
            placeholder="Add custom keyword..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
          />
          <button
            onClick={handleAddCustomKeyword}
            disabled={disabled || !customKeyword.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Selected Keywords Display */}
        {selectedKeywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
              >
                {keyword}
                <button
                  onClick={() => !disabled && handleKeywordToggle(keyword)}
                  disabled={disabled}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Profile Summary:</span>{' '}
          {profile.textQuery || 'No text description'} •{' '}
          {profile.country ? `${profile.country} • ` : 'Any location • '}
          {profile.profileType ? `${profile.profileType} • ` : 'Any type • '}
          {selectedKeywords.length > 0 ? `${selectedKeywords.length} keywords` : 'No keywords'}
        </p>
      </div>
    </div>
  );
}
