import elasticsearchService, { CompanyEntity } from './elasticsearch.service';

export interface MatchWeight {
  parameterName: string;
  weight: number; // 0-100, must sum to 100 across all parameters
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
  weights: MatchWeight[];
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
   * Search for entities matching an ideal profile and rank them
   */
  async searchAndRankMatches(
    request: SearchMatchRequest
  ): Promise<SearchMatchesResponse> {
    // Validate weights
    const totalWeight = request.weights.reduce((sum, w) => sum + w.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Weights must sum to 100, got ${totalWeight}`);
    }

    const threshold = request.minThreshold || 0;

    try {
      // Get parameters definition
      const parameters = elasticsearchService.getAvailableParameters();

      // Search for candidates matching the profile
      const candidates = await elasticsearchService.searchByProfile(
        request.idealProfile
      );

      // Create ideal entity for matching
      const idealEntity = this.createIdealEntity(request.idealProfile);

      // Calculate match % for each candidate
      const matchResults: SearchMatchResult[] = candidates
        .map((candidate) => {
          const activeWeights = request.weights.filter((w) => w.weight > 0);
          const parameterMatches: ParameterMatchResult[] = [];

          // Calculate match for each weighted parameter
          for (const weight of activeWeights) {
            const param = parameters.find((p) => p.name === weight.parameterName);
            if (!param) continue;

            const match = this.matchParameter(idealEntity, candidate, weight.parameterName, param);
            parameterMatches.push(match);
          }

          // Calculate weighted total
          let totalMatchPercentage = 0;
          for (const match of parameterMatches) {
            const weight = activeWeights.find((w) => w.parameterName === match.parameterName);
            if (weight) {
              totalMatchPercentage += (match.matchPercentage * weight.weight) / 100;
            }
          }

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
    // Validate weights sum to 100
    const totalWeight = request.weights.reduce((sum, w) => sum + w.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Weights must sum to 100, got ${totalWeight}`);
    }

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

    // Calculate weighted total
    let totalMatchPercentage = 0;
    for (const match of parameterMatches) {
      const weight = activeWeights.find((w) => w.parameterName === match.parameterName);
      if (weight) {
        totalMatchPercentage += (match.matchPercentage * weight.weight) / 100;
      }
    }

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
}

export default new MatchingService();
