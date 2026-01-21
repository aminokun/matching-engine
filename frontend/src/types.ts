// types.ts

// Unified Parameter Match Result (for export compatibility)
export interface ParameterMatchResult {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number;
  value1: any;
  value2: any;
  explanation: string;
}

// Backend Response Types
export interface SearchResult {
  profileId: string;
  score: number;
  companyDetails: {
    companyName: string;
    country: string;
    city: string;
    numberOfEmployees: number;
    annualTurnover: number;
    summaryOfActivity: string;
  };
  classification: {
    profileType: string;
    marketSegment: string[];
    servicesOffered: string[];
    keywords: string[];
  };
  primaryContact: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface BackendResponse {
  results: SearchResult[];
  totalHits: number;
  took: number;
  query?: string;
  extractedParams?: Record<string, unknown>;
  explanations?: Record<string, string>;
}

// ICP (Ideal Customer Profile) Types
export type ScoringType = 'geographic' | 'categorical' | 'semantic' | 'numeric' | 'exact';

export interface ICPCriterion {
  id: string;
  field: string;
  label: string;
  value: string | number | string[];
  weight: number; // 1-10
  scoringType: ScoringType;
  config?: {
    maxDistance?: number;
    tolerance?: number;
    minValue?: number;
    maxValue?: number;
    minSimilarity?: number;
  };
}

export interface ICPTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isActive: boolean;
  criteria: ICPCriterion[];
}

export interface ICPParameterMatchResult {
  criterionId: string;
  field: string;
  label: string;
  scoringType: ScoringType;
  weight: number;
  matchPercentage: number;
  icpValue: any;
  companyValue: any;
  explanation: string;
  skipped: boolean;
}

export interface ICPMatchResult {
  companyId: string;
  companyName: string;
  company: any;
  matchPercentage: number;
  parameterMatches: ICPParameterMatchResult[];
  totalCriteria: number;
  matchedCriteria: number;
  skippedCriteria: number;
  dataCompleteness: number;
  rank?: number;
}

export interface ICPMatchRequest {
  template?: ICPTemplate;
  minThreshold?: number;
  maxResults?: number;
}

export interface ICPMatchResponse {
  templateId: string;
  templateName: string;
  totalCompanies: number;
  matchesAboveThreshold: number;
  threshold: number;
  matches: ICPMatchResult[];
}

// Quick Match Request (inline criteria)
export interface QuickMatchRequest {
  criteria: Record<string, any>;
  weights?: Record<string, number>;
  minThreshold?: number;
  maxResults?: number;
}