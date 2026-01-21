/**
 * Categorical Service
 * Provides similarity scoring for categorical fields like profileType and marketSegment.
 * Uses predefined similarity matrices for known categories,
 * with fallback to semantic similarity for unknown categories.
 */

import embeddingService from './embedding.service';

interface SimilarityScore {
  score: number;
  explanation: string;
}

// Profile Type Similarity Matrix
// Values represent similarity percentage (0-100)
// Higher = more similar
const PROFILE_TYPE_PAIRS: Record<string, number> = {
  // Distributors and related
  'Distributor-Wholesaler': 85,
  'Distributor-Retailer': 60,
  'Distributor-Reseller': 80,
  'Distributor-Agent': 70,
  'Distributor-Broker': 65,
  'Distributor-Importer': 75,
  'Distributor-Exporter': 75,

  // Wholesalers and related
  'Wholesaler-Retailer': 60,
  'Wholesaler-Reseller': 75,
  'Wholesaler-Importer': 70,
  'Wholesaler-Exporter': 70,

  // Manufacturers and related
  'Manufacturer-Producer': 95,
  'Manufacturer-Distributor': 50,
  'Manufacturer-Wholesaler': 45,
  'Manufacturer-OEM': 85,
  'Manufacturer-Supplier': 70,

  // Service providers
  'Consultant-Advisor': 90,
  'Consultant-Service Provider': 70,
  'Integrator-Installer': 80,
  'Integrator-System Integrator': 95,

  // Retailers
  'Retailer-Reseller': 85,
  'Retailer-E-commerce': 80,
  'Retailer-Store': 90,

  // Very different types
  'Manufacturer-Retailer': 30,
  'Manufacturer-Consultant': 20,
  'Distributor-Consultant': 25,
  'Wholesaler-Consultant': 25,
};

// Market Segment Similarity Matrix
const MARKET_SEGMENT_PAIRS: Record<string, number> = {
  // Adjacent segments
  'enterprise-mid-market': 70,
  'mid-market-smb': 70,
  'smb-startup': 75,

  // Distant segments
  'enterprise-smb': 40,
  'enterprise-startup': 30,
  'mid-market-startup': 50,

  // B2B vs B2C
  'b2b-b2c': 40,
  'b2b-b2b2c': 70,
  'b2c-b2b2c': 70,

  // Industry verticals (similar)
  'technology-software': 85,
  'technology-hardware': 75,
  'software-saas': 90,
  'retail-e-commerce': 80,
  'healthcare-medical': 85,
  'finance-banking': 85,
  'finance-insurance': 75,
};

// Normalize category names for comparison
const normalizeCategory = (value: string): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');
};

// Create a lookup key from two values (order-independent)
const createPairKey = (value1: string, value2: string): string => {
  const norm1 = normalizeCategory(value1);
  const norm2 = normalizeCategory(value2);
  // Sort alphabetically so order doesn't matter
  const sorted = [norm1, norm2].sort();
  return `${sorted[0]}-${sorted[1]}`;
};

// Try to find similarity in a matrix (handles variations in naming)
const findInMatrix = (
  matrix: Record<string, number>,
  value1: string,
  value2: string
): number | null => {
  const norm1 = normalizeCategory(value1);
  const norm2 = normalizeCategory(value2);

  // Try direct key
  const key1 = `${norm1}-${norm2}`;
  const key2 = `${norm2}-${norm1}`;

  for (const [matrixKey, score] of Object.entries(matrix)) {
    const normalizedKey = normalizeCategory(matrixKey.replace('-', ' - ')).replace(' - ', '-');

    if (normalizedKey === key1 || normalizedKey === key2) {
      return score;
    }

    // Also try partial matching (e.g., "Distributor" matches "distributor")
    const [part1, part2] = matrixKey.toLowerCase().split('-');
    if (
      (norm1.includes(part1) && norm2.includes(part2)) ||
      (norm1.includes(part2) && norm2.includes(part1))
    ) {
      return score;
    }
  }

  return null;
};

class CategoricalService {
  /**
   * Calculate similarity between two profile types
   */
  getProfileTypeSimilarity(type1: string, type2: string): SimilarityScore {
    // Exact match
    if (normalizeCategory(type1) === normalizeCategory(type2)) {
      return {
        score: 100,
        explanation: `Exact match: ${type1}`,
      };
    }

    // Check matrix
    const matrixScore = findInMatrix(PROFILE_TYPE_PAIRS, type1, type2);
    if (matrixScore !== null) {
      return {
        score: matrixScore,
        explanation: `${type1} ↔ ${type2}: ${matrixScore}% similarity`,
      };
    }

    // Default for unknown combinations
    return {
      score: 20,
      explanation: `${type1} ↔ ${type2}: No known relationship (default 20%)`,
    };
  }

  /**
   * Calculate similarity between two market segments
   */
  getMarketSegmentSimilarity(segment1: string, segment2: string): SimilarityScore {
    // Exact match
    if (normalizeCategory(segment1) === normalizeCategory(segment2)) {
      return {
        score: 100,
        explanation: `Exact match: ${segment1}`,
      };
    }

    // Check matrix
    const matrixScore = findInMatrix(MARKET_SEGMENT_PAIRS, segment1, segment2);
    if (matrixScore !== null) {
      return {
        score: matrixScore,
        explanation: `${segment1} ↔ ${segment2}: ${matrixScore}% similarity`,
      };
    }

    // Default for unknown combinations
    return {
      score: 30,
      explanation: `${segment1} ↔ ${segment2}: No known relationship (default 30%)`,
    };
  }

  /**
   * Calculate semantic similarity using embeddings
   * Fallback for unknown categories
   */
  async calculateSemanticSimilarity(
    value1: string,
    value2: string
  ): Promise<SimilarityScore> {
    try {
      // Get embeddings for both values
      const [embedding1, embedding2] = await Promise.all([
        embeddingService.embed(value1),
        embeddingService.embed(value2),
      ]);

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1, embedding2);
      const score = Math.round(similarity * 100);

      return {
        score,
        explanation: `Semantic similarity: "${value1}" ↔ "${value2}" = ${score}%`,
      };
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      return {
        score: 0,
        explanation: `Failed to calculate semantic similarity`,
      };
    }
  }

  /**
   * Generic categorical similarity with fallback to semantic
   */
  async calculateSimilarity(
    value1: string,
    value2: string,
    fieldType: 'profileType' | 'marketSegment' | 'generic'
  ): Promise<SimilarityScore> {
    // Exact match always
    if (normalizeCategory(value1) === normalizeCategory(value2)) {
      return {
        score: 100,
        explanation: `Exact match: ${value1}`,
      };
    }

    // Try predefined matrices first
    if (fieldType === 'profileType') {
      const result = this.getProfileTypeSimilarity(value1, value2);
      if (result.score > 20) {
        return result;
      }
    } else if (fieldType === 'marketSegment') {
      const result = this.getMarketSegmentSimilarity(value1, value2);
      if (result.score > 30) {
        return result;
      }
    }

    // Fall back to semantic similarity for unknown combinations
    return this.calculateSemanticSimilarity(value1, value2);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Add a new profile type similarity pair
   */
  addProfileTypePair(type1: string, type2: string, similarity: number): void {
    const key = createPairKey(type1, type2);
    PROFILE_TYPE_PAIRS[key] = Math.max(0, Math.min(100, similarity));
  }

  /**
   * Add a new market segment similarity pair
   */
  addMarketSegmentPair(segment1: string, segment2: string, similarity: number): void {
    const key = createPairKey(segment1, segment2);
    MARKET_SEGMENT_PAIRS[key] = Math.max(0, Math.min(100, similarity));
  }
}

// Export singleton instance
export const categoricalService = new CategoricalService();
export default categoricalService;
