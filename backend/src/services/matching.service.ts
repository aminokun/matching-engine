import elasticsearchService, { CompanyEntity } from './elasticsearch.service';
import { neuralSearch } from './neural-search.service';
import { geographicService } from './geographic.service';
import { categoricalService } from './categorical.service';
import {
  ICPTemplate,
  ICPCriterion,
  ICPMatchResult,
  ICPMatchRequest,
  ICPMatchResponse,
  ParameterMatchResult as ICPParameterMatchResult,
  ScoringType,
  getDefaultScoringType,
} from '../types/icp-template';

export interface MatchWeight {
  parameterName: string;
  weight: number; // Priority value 1-5, higher = more important
  value?: string; // The actual value to match (for Notion parameters)
  type?: string; // 'notion' or undefined for elasticsearch parameters
}

export interface ParameterMatchResult {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number; // 0-100
  value1: any;
  value2: any;
  explanation: string;
}

export interface MatchResult {
  entity1Id: string;
  entity1Name: string;
  entity2Id: string;
  entity2Name: string;
  totalMatchPercentage: number; // 0-100, weighted average
  parameterMatches: ParameterMatchResult[];
  weights: MatchWeight[];
  timestamp: string;
}

export interface MatchRequest {
  entity1Id: string;
  entity2Id: string;
  weights: MatchWeight[];
}

/**
 * Levenshtein distance calculation for text similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const aa = a.toLowerCase();
  const bb = b.toLowerCase();

  const matrix: number[][] = [];

  for (let i = 0; i <= bb.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aa.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bb.length; i++) {
    for (let j = 1; j <= aa.length; j++) {
      if (bb.charAt(i - 1) === aa.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bb.length][aa.length];
}

/**
 * Convert Levenshtein distance to similarity percentage
 */
function textSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;
  return Math.max(0, 100 - (distance / maxLength) * 100);
}

/**
 * Check intersection of two arrays
 */
function arrayIntersection(arr1: any[], arr2: any[]): number {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;

  const matches = arr1.filter((item) =>
    arr2.some((item2) =>
      String(item).toLowerCase() === String(item2).toLowerCase()
    )
  );

  const maxLength = Math.max(arr1.length, arr2.length);
  return (matches.length / maxLength) * 100;
}

/**
 * Calculate numeric range similarity
 * Consider the overlap between two numeric ranges
 */
function numericSimilarity(value1: number, value2: number): number {
  if (value1 === 0 && value2 === 0) return 100;
  if (value1 === 0 || value2 === 0) return 0;

  const max = Math.max(value1, value2);
  const min = Math.min(value1, value2);
  const overlap = min / max;

  // Calculate similarity based on how close the values are
  // If they're the same, 100%. If one is twice the other, ~50%, etc.
  return overlap * 100;
}

export interface SearchCriteria {
  country?: string;
  profileType?: string;
  marketSegment?: string;
  keywords?: string[];
  textQuery?: string;
}

export interface SearchMatchRequest {
  idealProfile: SearchCriteria;
  weights: MatchWeight[]; // Priority-based weights (1-5 scale)
  minThreshold?: number; // 0-100, default 0
}

export interface SearchMatchResult {
  entity: any;
  matchPercentage: number;
  parameterMatches: ParameterMatchResult[];
  rank: number;
}

export interface SearchMatchesResponse {
  totalMatches: number;
  matchesAboveThreshold: number;
  threshold: number;
  matches: SearchMatchResult[];
}

class MatchingService {
  /**
   * Build query text from search criteria for neural search
   */
  private buildQueryText(criteria: SearchCriteria): string {
    const parts: string[] = [];
    if (criteria.textQuery) parts.push(criteria.textQuery);
    if (criteria.country) parts.push(`Country: ${criteria.country}`);
    if (criteria.profileType) parts.push(`Type: ${criteria.profileType}`);
    if (criteria.marketSegment) parts.push(`Market: ${criteria.marketSegment}`);
    if (criteria.keywords?.length) parts.push(`Keywords: ${criteria.keywords.join(', ')}`);
    return parts.join('. ') || 'company';
  }

  /**
   * Search for entities matching an ideal profile and rank them
   */
  async searchAndRankMatches(
    request: SearchMatchRequest
  ): Promise<SearchMatchesResponse> {
    const threshold = request.minThreshold || 0;

    try {
      // Get parameters definition
      const parameters = elasticsearchService.getAvailableParameters();

      // Build query text from ideal profile for neural search
      const queryText = this.buildQueryText(request.idealProfile);

      // Use neural search (OpenSearch calls Gemini via deployed ML model)
      const searchResults = await neuralSearch(queryText, 100);

      // Convert neural search results to CompanyEntity format
      const candidates: CompanyEntity[] = searchResults.map(r => ({
        profileId: r.profileId,
        companyDetails: r.companyDetails || {},
        classification: r.classification || {},
        primaryContact: r.primaryContact,
      } as CompanyEntity));

      // Create ideal entity for matching
      const idealEntity = this.createIdealEntity(request.idealProfile);

      // Calculate match % for each candidate
      const matchResults: SearchMatchResult[] = candidates
        .map((candidate) => {
          const activeWeights = request.weights.filter((w) => w.weight > 0);
          const parameterMatches: ParameterMatchResult[] = [];

          // Calculate match for each weighted parameter
          for (const weight of activeWeights) {
            // Check if this is a Notion parameter (has value metadata)
            if (weight.type === 'notion' && weight.value) {
              const match = this.matchNotionParameter(candidate, weight.parameterName, weight.value);
              parameterMatches.push(match);
            } else {
              // Standard elasticsearch parameter
              const param = parameters.find((p) => p.name === weight.parameterName);
              if (!param) continue;

              const match = this.matchParameter(idealEntity, candidate, weight.parameterName, param);
              parameterMatches.push(match);
            }
          }

          // Calculate priority-weighted total
          let totalWeightedScore = 0;
          let totalPriority = 0;

          for (const match of parameterMatches) {
            const weight = activeWeights.find((w) => w.parameterName === match.parameterName);
            if (weight) {
              // Multiply match percentage by priority value, then sum
              totalWeightedScore += match.matchPercentage * weight.weight;
              totalPriority += weight.weight;
            }
          }

          // Normalize by total priority to keep score in 0-100 range
          const totalMatchPercentage = totalPriority > 0 ? totalWeightedScore / totalPriority : 0;

          return {
            entity: candidate,
            matchPercentage: Math.round(totalMatchPercentage * 100) / 100,
            parameterMatches,
            rank: 0, // Will be set after sorting
          };
        })
        .filter((result) => result.matchPercentage >= threshold)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .map((result, index) => ({
          ...result,
          rank: index + 1,
        }));

      return {
        totalMatches: candidates.length,
        matchesAboveThreshold: matchResults.length,
        threshold,
        matches: matchResults,
      };
    } catch (error) {
      console.error('Search and rank error:', error);
      throw error;
    }
  }

  /**
   * Create a virtual "ideal entity" from search criteria for matching
   */
  private createIdealEntity(criteria: SearchCriteria): any {
    return {
      profileId: 'IDEAL_PROFILE',
      companyDetails: {
        companyName: criteria.textQuery || 'Ideal Company',
        country: criteria.country || '',
        city: '',
        numberOfEmployees: 0,
        annualTurnover: 0,
      },
      classification: {
        profileType: criteria.profileType || '',
        marketSegment: criteria.marketSegment || '',
        keywords: criteria.keywords || [],
        servicesOffered: [],
        clientTypesServed: [],
      },
    };
  }

  /**
   * Calculate match between two entities with custom weights
   */
  async matchWithCustomWeights(request: MatchRequest): Promise<MatchResult> {
    // Fetch both entities
    const entity1 = await elasticsearchService.getEntity(request.entity1Id);
    const entity2 = await elasticsearchService.getEntity(request.entity2Id);

    if (!entity1 || !entity2) {
      throw new Error('One or both entities not found');
    }

    // Get parameter definitions
    const parameters = elasticsearchService.getAvailableParameters();
    const activeWeights = request.weights.filter((w) => w.weight > 0);

    // Calculate match for each parameter
    const parameterMatches: ParameterMatchResult[] = [];

    for (const weight of activeWeights) {
      const param = parameters.find((p) => p.name === weight.parameterName);
      if (!param) continue;

      const match = this.matchParameter(entity1, entity2, weight.parameterName, param);
      parameterMatches.push(match);
    }

    // Calculate priority-weighted total
    let totalWeightedScore = 0;
    let totalPriority = 0;

    for (const match of parameterMatches) {
      const weight = activeWeights.find((w) => w.parameterName === match.parameterName);
      if (weight) {
        totalWeightedScore += match.matchPercentage * weight.weight;
        totalPriority += weight.weight;
      }
    }

    // Normalize by total priority to keep score in 0-100 range
    const totalMatchPercentage = totalPriority > 0 ? totalWeightedScore / totalPriority : 0;

    return {
      entity1Id: entity1.profileId,
      entity1Name: entity1.companyDetails.companyName,
      entity2Id: entity2.profileId,
      entity2Name: entity2.companyDetails.companyName,
      totalMatchPercentage: Math.round(totalMatchPercentage * 100) / 100,
      parameterMatches,
      weights: request.weights,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Match a Notion parameter value against a company entity
   * Tries to match the value against common fields (country, profileType, marketSegment, keywords)
   */
  private matchNotionParameter(
    candidate: CompanyEntity,
    parameterName: string,
    parameterValue: string
  ): ParameterMatchResult {
    const paramValueLower = parameterValue.toLowerCase();
    let matchPercentage = 0;
    let matchedField = '';

    // Try to match against country
    if (candidate.companyDetails.country) {
      const countryMatch = textSimilarity(
        candidate.companyDetails.country,
        parameterValue
      );
      if (countryMatch > matchPercentage) {
        matchPercentage = countryMatch;
        matchedField = 'country';
      }
    }

    // Try to match against profileType
    if (candidate.classification.profileType) {
      const profileMatch = textSimilarity(
        candidate.classification.profileType,
        parameterValue
      );
      if (profileMatch > matchPercentage) {
        matchPercentage = profileMatch;
        matchedField = 'profileType';
      }
    }

    // Try to match against marketSegment
    if (candidate.classification.marketSegment) {
      const segmentMatch = textSimilarity(
        candidate.classification.marketSegment,
        parameterValue
      );
      if (segmentMatch > matchPercentage) {
        matchPercentage = segmentMatch;
        matchedField = 'marketSegment';
      }
    }

    // Try to match against keywords
    if (candidate.classification.keywords && candidate.classification.keywords.length > 0) {
      const keywordMatches = candidate.classification.keywords.filter((k) =>
        String(k).toLowerCase().includes(paramValueLower) ||
        paramValueLower.includes(String(k).toLowerCase())
      );
      if (keywordMatches.length > 0) {
        const keywordMatch = (keywordMatches.length / candidate.classification.keywords.length) * 100;
        if (keywordMatch > matchPercentage) {
          matchPercentage = keywordMatch;
          matchedField = 'keywords';
        }
      }
    }

    return {
      parameterName,
      parameterLabel: parameterValue,
      type: 'text',
      matchPercentage: Math.round(matchPercentage * 100) / 100,
      value1: parameterValue,
      value2: matchedField ? candidate[matchedField as keyof CompanyEntity] : 'No match',
      explanation: matchPercentage > 0
        ? `Matched "${parameterValue}" against ${matchedField}: ${Math.round(matchPercentage)}%`
        : `No match found for "${parameterValue}"`,
    };
  }

  /**
   * Match a single parameter between two entities
   */
  private matchParameter(
    entity1: CompanyEntity,
    entity2: CompanyEntity,
    parameterName: string,
    param: any
  ): ParameterMatchResult {
    const getValue = (entity: CompanyEntity, path: string): any => {
      const parts = path.split('.');
      let current: any = entity;
      for (const part of parts) {
        current = current?.[part];
      }
      return current;
    };

    const value1 = getValue(entity1, param.path);
    const value2 = getValue(entity2, param.path);

    let matchPercentage = 0;
    let explanation = '';

    if (param.type === 'exact') {
      const match =
        String(value1).toLowerCase() === String(value2).toLowerCase();
      matchPercentage = match ? 100 : 0;
      explanation = match
        ? `Exact match: "${value1}" = "${value2}"`
        : `No match: "${value1}" ≠ "${value2}"`;
    } else if (param.type === 'numeric') {
      matchPercentage = numericSimilarity(
        Number(value1) || 0,
        Number(value2) || 0
      );
      explanation = `Numeric similarity: ${value1} vs ${value2} = ${Math.round(matchPercentage)}%`;
    } else if (param.type === 'text') {
      if (Array.isArray(value1) && Array.isArray(value2)) {
        // Array comparison (keywords, services, etc.)
        matchPercentage = arrayIntersection(value1, value2);
        const intersection = value1.filter((item) =>
          value2.some((item2) =>
            String(item).toLowerCase() === String(item2).toLowerCase()
          )
        );
        explanation = `Array intersection: [${intersection.join(', ')}] = ${Math.round(matchPercentage)}%`;
      } else {
        // String comparison
        matchPercentage = textSimilarity(String(value1) || '', String(value2) || '');
        explanation = `Text similarity: "${value1}" vs "${value2}" = ${Math.round(matchPercentage)}%`;
      }
    }

    return {
      parameterName,
      parameterLabel: param.label,
      type: param.type,
      matchPercentage: Math.round(matchPercentage * 100) / 100,
      value1,
      value2,
      explanation,
    };
  }

  /**
   * Match companies against an ICP template
   * Uses the new scoring types (geographic, categorical, semantic, numeric, exact)
   * with proper missing data handling (skip and normalize)
   */
  async matchWithICPTemplate(request: ICPMatchRequest): Promise<ICPMatchResponse> {
    const template = request.template;
    if (!template) {
      throw new Error('ICP template is required');
    }

    const threshold = request.minThreshold || 0;
    const maxResults = request.maxResults || 100;

    try {
      // Build query text from ICP criteria for neural search
      const queryText = this.buildICPQueryText(template.criteria);

      // Use neural search to find candidates
      const searchResults = await neuralSearch(queryText, maxResults);

      // Convert to CompanyEntity format
      const candidates: CompanyEntity[] = searchResults.map((r) => ({
        profileId: r.profileId,
        companyDetails: r.companyDetails || {},
        classification: r.classification || {},
        primaryContact: r.primaryContact,
      } as CompanyEntity));

      // Match each candidate against ICP
      const matchResults: ICPMatchResult[] = [];

      for (const candidate of candidates) {
        const result = await this.matchCompanyToICP(candidate, template);
        if (result.matchPercentage >= threshold) {
          matchResults.push(result);
        }
      }

      // Sort by match percentage and assign ranks
      matchResults.sort((a, b) => b.matchPercentage - a.matchPercentage);
      matchResults.forEach((result, index) => {
        result.rank = index + 1;
      });

      return {
        templateId: template.id,
        templateName: template.name,
        totalCompanies: candidates.length,
        matchesAboveThreshold: matchResults.length,
        threshold,
        matches: matchResults.slice(0, maxResults),
      };
    } catch (error) {
      console.error('ICP matching error:', error);
      throw error;
    }
  }

  /**
   * Build query text from ICP criteria for neural search
   */
  private buildICPQueryText(criteria: ICPCriterion[]): string {
    const parts: string[] = [];

    for (const criterion of criteria) {
      const value = Array.isArray(criterion.value)
        ? criterion.value.join(', ')
        : String(criterion.value);

      if (criterion.field.includes('country') || criterion.field.includes('city')) {
        parts.push(`Location: ${value}`);
      } else if (criterion.field.includes('profileType')) {
        parts.push(`Type: ${value}`);
      } else if (criterion.field.includes('marketSegment')) {
        parts.push(`Market: ${value}`);
      } else if (criterion.field.includes('keywords')) {
        parts.push(`Keywords: ${value}`);
      } else {
        parts.push(`${criterion.label}: ${value}`);
      }
    }

    return parts.join('. ') || 'company';
  }

  /**
   * Match a single company against an ICP template
   */
  private async matchCompanyToICP(
    company: CompanyEntity,
    template: ICPTemplate
  ): Promise<ICPMatchResult> {
    const parameterMatches: ICPParameterMatchResult[] = [];
    const skippedParameters: string[] = [];

    let totalWeightedScore = 0;
    let totalWeightUsed = 0;

    for (const criterion of template.criteria) {
      const companyValue = this.getCompanyValue(company, criterion.field);

      // Skip if company is missing this field
      if (companyValue === null || companyValue === undefined || companyValue === '') {
        skippedParameters.push(criterion.field);
        parameterMatches.push({
          criterionId: criterion.id,
          field: criterion.field,
          label: criterion.label,
          scoringType: criterion.scoringType,
          weight: criterion.weight,
          matchPercentage: 0,
          icpValue: criterion.value,
          companyValue: null,
          explanation: `Skipped: Company missing ${criterion.label}`,
          skipped: true,
        });
        continue;
      }

      // Calculate score based on scoring type
      const scoreResult = await this.calculateCriterionScore(criterion, companyValue);

      parameterMatches.push({
        criterionId: criterion.id,
        field: criterion.field,
        label: criterion.label,
        scoringType: criterion.scoringType,
        weight: criterion.weight,
        matchPercentage: scoreResult.score,
        icpValue: criterion.value,
        companyValue,
        explanation: scoreResult.explanation,
        skipped: false,
      });

      // Add to weighted total
      totalWeightedScore += scoreResult.score * criterion.weight;
      totalWeightUsed += criterion.weight;
    }

    // Normalize by actual weights used (skip missing data handling)
    const matchPercentage =
      totalWeightUsed > 0 ? Math.round((totalWeightedScore / totalWeightUsed) * 100) / 100 : 0;

    const totalCriteria = template.criteria.length;
    const matchedCriteria = totalCriteria - skippedParameters.length;
    const dataCompleteness =
      totalCriteria > 0 ? Math.round((matchedCriteria / totalCriteria) * 100) : 0;

    return {
      companyId: company.profileId,
      companyName: company.companyDetails?.companyName || 'Unknown',
      company,
      matchPercentage,
      parameterMatches,
      totalCriteria,
      matchedCriteria,
      skippedCriteria: skippedParameters.length,
      dataCompleteness,
    };
  }

  /**
   * Get a value from a company entity by field path
   */
  private getCompanyValue(company: CompanyEntity, fieldPath: string): any {
    // Handle both full paths and short names
    const paths = [
      fieldPath,
      `companyDetails.${fieldPath}`,
      `classification.${fieldPath}`,
      `primaryContact.${fieldPath}`,
    ];

    for (const path of paths) {
      const parts = path.split('.');
      let current: any = company;

      for (const part of parts) {
        if (current === null || current === undefined) break;
        current = current[part];
      }

      if (current !== null && current !== undefined && current !== '') {
        return current;
      }
    }

    return null;
  }

  /**
   * Calculate score for a criterion based on its scoring type
   */
  private async calculateCriterionScore(
    criterion: ICPCriterion,
    companyValue: any
  ): Promise<{ score: number; explanation: string }> {
    const icpValue = criterion.value;
    const scoringType = criterion.scoringType || getDefaultScoringType(criterion.field);

    switch (scoringType) {
      case 'geographic':
        return this.calculateGeographicScore(String(icpValue), String(companyValue));

      case 'categorical':
        return this.calculateCategoricalScore(
          String(icpValue),
          String(companyValue),
          criterion.field
        );

      case 'numeric':
        return this.calculateNumericScore(
          Number(icpValue) || 0,
          Number(companyValue) || 0,
          criterion.config
        );

      case 'exact':
        return this.calculateExactScore(icpValue, companyValue);

      case 'semantic':
      default:
        return this.calculateSemanticScore(icpValue, companyValue);
    }
  }

  /**
   * Geographic scoring using distance-based calculation
   */
  private calculateGeographicScore(
    icpValue: string,
    companyValue: string
  ): { score: number; explanation: string } {
    const result = geographicService.calculateProximityScore(icpValue, companyValue);
    return {
      score: result.score,
      explanation: result.explanation,
    };
  }

  /**
   * Categorical scoring using similarity matrices
   */
  private calculateCategoricalScore(
    icpValue: string,
    companyValue: string,
    field: string
  ): { score: number; explanation: string } {
    if (field.includes('profileType')) {
      const result = categoricalService.getProfileTypeSimilarity(icpValue, companyValue);
      return { score: result.score, explanation: result.explanation };
    } else if (field.includes('marketSegment')) {
      const result = categoricalService.getMarketSegmentSimilarity(icpValue, companyValue);
      return { score: result.score, explanation: result.explanation };
    }

    // Default categorical comparison
    const match = icpValue.toLowerCase() === companyValue.toLowerCase();
    return {
      score: match ? 100 : 30,
      explanation: match ? `Exact match: ${icpValue}` : `${icpValue} ↔ ${companyValue}: 30%`,
    };
  }

  /**
   * Numeric scoring based on proximity
   */
  private calculateNumericScore(
    icpValue: number,
    companyValue: number,
    config?: { tolerance?: number; minValue?: number; maxValue?: number }
  ): { score: number; explanation: string } {
    if (icpValue === 0 && companyValue === 0) {
      return { score: 100, explanation: 'Both values are 0' };
    }
    if (icpValue === 0 || companyValue === 0) {
      return { score: 0, explanation: 'One value is 0' };
    }

    // Use tolerance if configured
    if (config?.tolerance) {
      const lowerBound = icpValue * (1 - config.tolerance);
      const upperBound = icpValue * (1 + config.tolerance);
      if (companyValue >= lowerBound && companyValue <= upperBound) {
        return {
          score: 100,
          explanation: `${companyValue} is within ±${config.tolerance * 100}% of ${icpValue}`,
        };
      }
    }

    // Calculate ratio-based similarity
    const max = Math.max(icpValue, companyValue);
    const min = Math.min(icpValue, companyValue);
    const score = Math.round((min / max) * 100);

    return {
      score,
      explanation: `Numeric similarity: ${companyValue} vs ${icpValue} = ${score}%`,
    };
  }

  /**
   * Exact matching (100% or 0%)
   */
  private calculateExactScore(
    icpValue: any,
    companyValue: any
  ): { score: number; explanation: string } {
    const match = String(icpValue).toLowerCase() === String(companyValue).toLowerCase();
    return {
      score: match ? 100 : 0,
      explanation: match
        ? `Exact match: "${icpValue}"`
        : `No match: "${icpValue}" ≠ "${companyValue}"`,
    };
  }

  /**
   * Semantic/text similarity scoring
   */
  private calculateSemanticScore(
    icpValue: any,
    companyValue: any
  ): { score: number; explanation: string } {
    // Handle arrays (keywords, services)
    if (Array.isArray(icpValue) && Array.isArray(companyValue)) {
      const score = arrayIntersection(icpValue, companyValue);
      const intersection = icpValue.filter((item) =>
        companyValue.some(
          (item2) => String(item).toLowerCase() === String(item2).toLowerCase()
        )
      );
      return {
        score: Math.round(score),
        explanation: `Array match: [${intersection.join(', ')}] = ${Math.round(score)}%`,
      };
    }

    // Handle array vs string
    if (Array.isArray(icpValue)) {
      const matches = icpValue.filter(
        (item) =>
          String(companyValue).toLowerCase().includes(String(item).toLowerCase()) ||
          String(item).toLowerCase().includes(String(companyValue).toLowerCase())
      );
      const score = (matches.length / icpValue.length) * 100;
      return {
        score: Math.round(score),
        explanation: `Matched ${matches.length}/${icpValue.length} keywords = ${Math.round(score)}%`,
      };
    }

    if (Array.isArray(companyValue)) {
      const matches = companyValue.filter(
        (item) =>
          String(icpValue).toLowerCase().includes(String(item).toLowerCase()) ||
          String(item).toLowerCase().includes(String(icpValue).toLowerCase())
      );
      const score = (matches.length / companyValue.length) * 100;
      return {
        score: Math.round(score),
        explanation: `Matched ${matches.length}/${companyValue.length} values = ${Math.round(score)}%`,
      };
    }

    // String similarity
    const score = textSimilarity(String(icpValue), String(companyValue));
    return {
      score: Math.round(score),
      explanation: `Text similarity: "${icpValue}" vs "${companyValue}" = ${Math.round(score)}%`,
    };
  }
}

export default new MatchingService();
