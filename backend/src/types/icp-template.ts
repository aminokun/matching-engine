/**
 * ICP (Ideal Customer Profile) Template Types
 * Used for defining and matching ideal company profiles against scraped companies.
 */

/**
 * Scoring type determines how a criterion is matched
 */
export type ScoringType =
  | 'geographic'   // Distance-based scoring (km calculation)
  | 'categorical'  // Profile type/segment similarity matrices
  | 'semantic'     // Embedding-based similarity
  | 'numeric'      // Range/proximity scoring
  | 'exact';       // Binary match (100% or 0%)

/**
 * A single criterion in an ICP template
 */
export interface ICPCriterion {
  id: string;
  field: string;              // Field path, e.g., 'companyDetails.country', 'classification.profileType'
  label: string;              // Human-readable label
  value: string | number | string[];  // Target value(s)
  weight: number;             // Importance weight (1-10)
  scoringType: ScoringType;   // How to score this criterion

  // Optional configuration per scoring type
  config?: {
    // For geographic scoring
    maxDistance?: number;     // Custom max distance in km (default: 5000)

    // For numeric scoring
    tolerance?: number;       // Acceptable range as percentage (e.g., 0.2 = ±20%)
    minValue?: number;        // Minimum acceptable value
    maxValue?: number;        // Maximum acceptable value

    // For semantic scoring
    minSimilarity?: number;   // Minimum similarity threshold (0-1)
  };
}

/**
 * An ICP Template containing multiple criteria
 */
export interface ICPTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  isActive: boolean;

  criteria: ICPCriterion[];
}

/**
 * Result of matching a single parameter/criterion
 */
export interface ParameterMatchResult {
  criterionId: string;
  field: string;
  label: string;
  scoringType: ScoringType;
  weight: number;

  matchPercentage: number;    // 0-100
  icpValue: any;              // Value from ICP criterion
  companyValue: any;          // Value from company being matched
  explanation: string;        // Human-readable explanation

  skipped: boolean;           // True if company was missing this field
}

/**
 * Result of matching a company against an ICP template
 */
export interface ICPMatchResult {
  companyId: string;
  companyName: string;
  company: any;               // Full company entity

  // Scoring
  matchPercentage: number;    // Overall weighted match (0-100)
  parameterMatches: ParameterMatchResult[];

  // Data completeness
  totalCriteria: number;      // Total criteria in ICP
  matchedCriteria: number;    // Criteria that could be scored
  skippedCriteria: number;    // Criteria skipped due to missing data
  dataCompleteness: number;   // % of ICP fields available in company

  // Ranking
  rank?: number;
}

/**
 * Request to match companies against an ICP template
 */
export interface ICPMatchRequest {
  templateId?: string;        // Use existing template from Notion
  template?: ICPTemplate;     // Or provide inline template
  minThreshold?: number;      // Minimum match % to include (default: 0)
  maxResults?: number;        // Limit results (default: 100)
}

/**
 * Response from ICP matching
 */
export interface ICPMatchResponse {
  templateId: string;
  templateName: string;
  totalCompanies: number;     // Total companies searched
  matchesAboveThreshold: number;
  threshold: number;
  matches: ICPMatchResult[];
}

/**
 * Mapping from field names to scoring types
 * Used to automatically determine scoring type based on field
 */
export const FIELD_SCORING_TYPES: Record<string, ScoringType> = {
  // Geographic fields
  'companyDetails.country': 'geographic',
  'companyDetails.city': 'geographic',
  'country': 'geographic',
  'city': 'geographic',

  // Categorical fields
  'classification.profileType': 'categorical',
  'classification.marketSegment': 'categorical',
  'profileType': 'categorical',
  'marketSegment': 'categorical',

  // Numeric fields
  'companyDetails.numberOfEmployees': 'numeric',
  'companyDetails.annualTurnover': 'numeric',
  'numberOfEmployees': 'numeric',
  'annualTurnover': 'numeric',

  // Semantic/text fields
  'classification.keywords': 'semantic',
  'classification.servicesOffered': 'semantic',
  'companyDetails.summaryOfActivity': 'semantic',
  'companyDetails.companyName': 'semantic',
  'keywords': 'semantic',
  'servicesOffered': 'semantic',
};

/**
 * Get the default scoring type for a field
 */
export const getDefaultScoringType = (field: string): ScoringType => {
  return FIELD_SCORING_TYPES[field] || 'semantic';
};

/**
 * Helper to create a criterion with defaults
 */
export const createCriterion = (
  field: string,
  value: string | number | string[],
  weight: number = 5,
  label?: string
): ICPCriterion => {
  return {
    id: `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    field,
    label: label || field.split('.').pop() || field,
    value,
    weight: Math.max(1, Math.min(10, weight)),
    scoringType: getDefaultScoringType(field),
  };
};

/**
 * Helper to create a template with defaults
 */
export const createTemplate = (
  name: string,
  criteria: ICPCriterion[],
  description?: string
): ICPTemplate => {
  const now = new Date();
  return {
    id: `icp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    criteria,
  };
};
