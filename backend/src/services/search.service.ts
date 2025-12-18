import { Client } from '@opensearch-project/opensearch';
import geminiEmbeddingService from './gemini-embedding.service';

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://192.168.189.161:9200',
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'company-profiles';

export interface SearchResult {
  profileId: string;
  score: number;
  matchPercentage: number;
  companyDetails: any;
  classification: any;
  primaryContact: any;
}

class SearchService {
  /**
   * Pure vector search using Gemini embeddings
   * @param queryText - Combined search text from filters/query
   * @param k - Number of results to return
   */
  async vectorSearch(queryText: string, k: number = 20): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      console.log('Generating embedding for query:', queryText);
      const queryVector = await geminiEmbeddingService.embed(queryText);

      // Execute knn search
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          size: k,
          query: {
            knn: {
              semanticEmbedding: {
                vector: queryVector,
                k: k,
              },
            },
          },
        },
      });

      // Map results with match percentage based on score
      // OpenSearch knn returns scores between 0 and 1 for cosine similarity
      return response.body.hits.hits.map((hit: any) => {
        // Score normalization: knn scores are typically 0-1 for cosine
        const score = hit._score || 0;
        // Convert to percentage (cosine similarity of 1 = 100% match)
        const matchPercentage = Math.min(100, Math.round(score * 100));

        return {
          profileId: hit._source.profileId,
          score: score,
          matchPercentage: matchPercentage,
          companyDetails: hit._source.companyDetails,
          classification: hit._source.classification,
          primaryContact: hit._source.primaryContact,
        };
      });
    } catch (error) {
      console.error('OpenSearch vector search error:', error);
      throw new Error('Failed to execute vector search');
    }
  }

  /**
   * Search using dynamic filters - converts filters to query text and does vector search
   * @param filters - Dynamic filter object from Notion/frontend
   */
  async searchWithFilters(filters: Record<string, any>): Promise<SearchResult[]> {
    // Convert filters to query text
    const queryText = this.filtersToQueryText(filters);

    if (!queryText.trim()) {
      // If no filters, return all documents (fallback)
      return this.getAllDocuments(20);
    }

    return this.vectorSearch(queryText);
  }

  /**
   * Convert filter object to natural language query text
   */
  private filtersToQueryText(filters: Record<string, any>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;

      if (Array.isArray(value) && value.length > 0) {
        parts.push(value.join(' '));
      } else if (typeof value === 'string' && value.trim()) {
        parts.push(value);
      } else if (typeof value === 'object') {
        // Handle nested objects like { min, max } for ranges
        const nested = Object.values(value).filter(v => v !== null && v !== undefined);
        if (nested.length > 0) {
          parts.push(nested.join(' to '));
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Fallback: get all documents without vector search
   */
  async getAllDocuments(limit: number = 20): Promise<SearchResult[]> {
    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          size: limit,
          query: { match_all: {} },
        },
      });

      return response.body.hits.hits.map((hit: any) => ({
        profileId: hit._source.profileId,
        score: 1,
        matchPercentage: 100,
        companyDetails: hit._source.companyDetails,
        classification: hit._source.classification,
        primaryContact: hit._source.primaryContact,
      }));
    } catch (error) {
      console.error('OpenSearch getAllDocuments error:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const health = await client.cluster.health();
      return health.body.status !== 'red';
    } catch (error) {
      console.error('OpenSearch health check failed:', error);
      return false;
    }
  }

  async getProfile(profileId: string): Promise<any> {
    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            term: { profileId: profileId },
          },
        },
      });

      if (response.body.hits.hits.length === 0) {
        return null;
      }

      return response.body.hits.hits[0]._source;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}

export default new SearchService();
