import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
  // Disable node sniffing to work with single node in development
  nodeFilter: (node: any) => {
    // Only use the configured node
    return true;
  },
  enableDebugLogger: false,
  requestTimeout: 10000,
});

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'company-profiles';

export interface CompanyEntity {
  profileId: string;
  ingestionDate: string;
  source: string;
  companyDetails: {
    companyName: string;
    country: string;
    city: string;
    summaryOfActivity: string;
    dateEstablished: string;
    numberOfEmployees: number;
    annualTurnover: number;
    website: string;
    linkedinPage: string;
    telephone: string;
    generalEmail: string;
  };
  classification: {
    profileType: string;
    marketSegment: string;
    keywords: string[];
    servicesOffered: string[];
    clientTypesServed: string[];
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    gender: string;
    email: string;
    telephone: string;
    linkedinPage: string;
    type: string;
  };
}

class ElasticsearchService {
  /**
   * Get a single entity by its profile ID
   */
  async getEntity(profileId: string): Promise<CompanyEntity | null> {
    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            match: {
              profileId: profileId,
            },
          },
        },
      });

      if (response.hits.hits.length === 0) {
        return null;
      }

      return response.hits.hits[0]._source as CompanyEntity;
    } catch (error) {
      console.error('Elasticsearch getEntity error:', error);
      throw new Error(`Failed to fetch entity ${profileId}`);
    }
  }

  /**
   * Get all available entities
   */
  async getAllEntities(limit: number = 100): Promise<CompanyEntity[]> {
    try {
      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            match_all: {},
          },
        },
        size: limit,
      });

      return response.hits.hits.map((hit: any) => hit._source as CompanyEntity);
    } catch (error) {
      console.error('Elasticsearch getAllEntities error:', error);
      throw new Error('Failed to fetch entities');
    }
  }

  /**
   * Get entity count
   */
  async getEntityCount(): Promise<number> {
    try {
      const response = await client.count({
        index: INDEX_NAME,
      });

      return response.count;
    } catch (error) {
      console.error('Elasticsearch count error:', error);
      throw new Error('Failed to count entities');
    }
  }

  /**
   * Search for entities by profile criteria (country, type, keywords, etc.)
   * Used for finding candidate matches
   */
  async searchByProfile(criteria: {
    country?: string;
    profileType?: string;
    marketSegment?: string;
    keywords?: string[];
    textQuery?: string;
  }): Promise<CompanyEntity[]> {
    try {
      const must: any[] = [];
      const should: any[] = [];

      // Exact match for country
      if (criteria.country) {
        must.push({
          match: {
            'companyDetails.country': {
              query: criteria.country,
              fuzziness: 'AUTO', // Allow fuzzy match for country names
            },
          },
        });
      }

      // Exact match for profile type
      if (criteria.profileType) {
        must.push({
          match: {
            'classification.profileType': criteria.profileType,
          },
        });
      }

      // Should match for market segment
      if (criteria.marketSegment) {
        should.push({
          match: {
            'classification.marketSegment': criteria.marketSegment,
          },
        });
      }

      // Should match for keywords
      if (criteria.keywords && criteria.keywords.length > 0) {
        criteria.keywords.forEach((keyword) => {
          should.push({
            match: {
              'classification.keywords': keyword,
            },
          });
        });
      }

      // Text search across multiple fields
      if (criteria.textQuery) {
        should.push(
          {
            match: {
              'companyDetails.companyName': criteria.textQuery,
            },
          },
          {
            match: {
              'companyDetails.summaryOfActivity': criteria.textQuery,
            },
          },
          {
            match: {
              'classification.keywords': criteria.textQuery,
            },
          }
        );
      }

      const query: any = {
        bool: {},
      };

      if (must.length > 0) {
        query.bool.must = must;
      }
      if (should.length > 0) {
        query.bool.should = should;
        query.bool.minimum_should_match = 1;
      }

      // If no criteria, match all
      if (must.length === 0 && should.length === 0) {
        query.match_all = {};
      }

      const response = await client.search({
        index: INDEX_NAME,
        body: {
          query,
          size: 100, // Get up to 100 candidates
        },
      });

      return response.hits.hits.map((hit: any) => hit._source as CompanyEntity);
    } catch (error) {
      console.error('Elasticsearch searchByProfile error:', error);
      throw new Error('Failed to search by profile');
    }
  }

  /**
   * Get available parameters/fields for matching
   */
  getAvailableParameters(): Array<{
    name: string;
    label: string;
    type: 'exact' | 'numeric' | 'text' | 'semantic';
    path: string;
  }> {
    return [
      {
        name: 'country',
        label: 'Country',
        type: 'exact',
        path: 'companyDetails.country',
      },
      {
        name: 'marketSegment',
        label: 'Market Segment',
        type: 'exact',
        path: 'classification.marketSegment',
      },
      {
        name: 'city',
        label: 'City',
        type: 'exact',
        path: 'companyDetails.city',
      },
      {
        name: 'profileType',
        label: 'Profile Type (Distributor/Manufacturer/etc)',
        type: 'exact',
        path: 'classification.profileType',
      },
      {
        name: 'numberOfEmployees',
        label: 'Number of Employees',
        type: 'numeric',
        path: 'companyDetails.numberOfEmployees',
      },
      {
        name: 'annualTurnover',
        label: 'Annual Turnover',
        type: 'numeric',
        path: 'companyDetails.annualTurnover',
      },
      {
        name: 'keywords',
        label: 'Keywords/Industry Focus',
        type: 'text',
        path: 'classification.keywords',
      },
      {
        name: 'servicesOffered',
        label: 'Services Offered',
        type: 'text',
        path: 'classification.servicesOffered',
      },
      {
        name: 'companyName',
        label: 'Company Name',
        type: 'text',
        path: 'companyDetails.companyName',
      },
    ];
  }
}

export default new ElasticsearchService();
