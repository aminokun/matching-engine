import { Client } from '@elastic/elasticsearch';
import { SearchParams } from './claude.service';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'company-profiles';

export interface SearchResult {
  profileId: string;
  score: number;
  companyDetails: any;
  classification: any;
  primaryContact: any;
}

class SearchService {
  async search(params: SearchParams, queryEmbedding?: number[]): Promise<SearchResult[]> {
    const query = this.buildQuery(params, queryEmbedding);

    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: query,
        size: 20,
      });

      return response.hits.hits.map((hit: any) => ({
        profileId: hit._source.profileId,
        score: hit._score || 0,
        companyDetails: hit._source.companyDetails,
        classification: hit._source.classification,
        primaryContact: hit._source.primaryContact,
      }));
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw new Error('Failed to execute search');
    }
  }

  private buildQuery(params: SearchParams, queryEmbedding?: number[]) {
    const mustClauses: any[] = [];
    const shouldClauses: any[] = [];
    const filterClauses: any[] = [];

    // Exact match filters
    if (params.country) {
      filterClauses.push({
        term: { 'companyDetails.country': params.country },
      });
    }

    if (params.city) {
      filterClauses.push({
        term: { 'companyDetails.city.keyword': params.city },
      });
    }

    if (params.profileType) {
      shouldClauses.push({
        term: {
          'classification.profileType': {
            value: params.profileType,
            boost: 9.0, // High weight for profile type
          },
        },
      });
    }

    // Market segment matching
    if (params.marketSegment && params.marketSegment.length > 0) {
      shouldClauses.push({
        terms: {
          'classification.marketSegment': params.marketSegment,
          boost: 6.0,
        },
      });
    }

    // Services matching
    if (params.servicesOffered && params.servicesOffered.length > 0) {
      shouldClauses.push({
        terms: {
          'classification.servicesOffered': params.servicesOffered,
          boost: 7.0,
        },
      });
    }

    // Employee range filter
    if (params.employees) {
      const rangeFilter: any = {};
      if (params.employees.min !== null && params.employees.min !== undefined) {
        rangeFilter.gte = params.employees.min;
      }
      if (params.employees.max !== null && params.employees.max !== undefined) {
        rangeFilter.lte = params.employees.max;
      }
      if (Object.keys(rangeFilter).length > 0) {
        filterClauses.push({
          range: { 'companyDetails.numberOfEmployees': rangeFilter },
        });
      }
    }

    // Turnover range filter
    if (params.turnover) {
      const rangeFilter: any = {};
      if (params.turnover.min !== null && params.turnover.min !== undefined) {
        rangeFilter.gte = params.turnover.min;
      }
      if (params.turnover.max !== null && params.turnover.max !== undefined) {
        rangeFilter.lte = params.turnover.max;
      }
      if (Object.keys(rangeFilter).length > 0) {
        filterClauses.push({
          range: { 'companyDetails.annualTurnover': rangeFilter },
        });
      }
    }

    // Text matching on keywords
    if (params.keywords && params.keywords.length > 0) {
      const keywordText = params.keywords.join(' ');
      shouldClauses.push({
        multi_match: {
          query: keywordText,
          fields: [
            'companyDetails.companyName^3',
            'companyDetails.summaryOfActivity^2',
            'classification.keywords',
          ],
          type: 'best_fields',
          boost: 8.0,
        },
      });
    }

    // Vector similarity search (if embedding provided)
    if (queryEmbedding && queryEmbedding.length > 0) {
      shouldClauses.push({
        script_score: {
          query: { match_all: {} },
          script: {
            source: "cosineSimilarity(params.query_vector, 'semanticEmbedding') + 1.0",
            params: {
              query_vector: queryEmbedding,
            },
          },
          boost: 10.0, // High weight for semantic similarity
        },
      });
    }

    // Build final query
    const boolQuery: any = {};

    if (mustClauses.length > 0) {
      boolQuery.must = mustClauses;
    }

    if (shouldClauses.length > 0) {
      boolQuery.should = shouldClauses;
    }

    if (filterClauses.length > 0) {
      boolQuery.filter = filterClauses;
    }

    // If no clauses, match all
    if (Object.keys(boolQuery).length === 0) {
      return {
        query: { match_all: {} },
      };
    }

    return {
      query: {
        bool: boolQuery,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const health = await client.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      console.error('Elasticsearch health check failed:', error);
      return false;
    }
  }

  async getProfile(profileId: string): Promise<any> {
    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            term: { 'profileId': profileId },
          },
        },
      });

      if (response.hits.hits.length === 0) {
        return null;
      }

      return response.hits.hits[0]._source;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}

export default new SearchService();
