import { Client } from '@opensearch-project/opensearch';

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'dutch-companies-vector-index';
const VECTOR_FIELD = process.env.VECTOR_FIELD || 'embedding_vector';
const MODEL_ID = process.env.OPENSEARCH_MODEL_ID;

export interface NeuralSearchResult {
  profileId: string;
  score: number;
  matchPercentage: number;
  companyDetails: any;
  classification: any;
  primaryContact: any;
}

/**
 * Perform neural search using OpenSearch's neural query type.
 * This uses a deployed ML model on OpenSearch that calls Gemini for embeddings.
 *
 * @param queryText - Natural language query text
 * @param k - Number of results to return (default 20)
 */
export async function neuralSearch(queryText: string, k: number = 20): Promise<NeuralSearchResult[]> {
  if (!MODEL_ID) {
    throw new Error('OPENSEARCH_MODEL_ID environment variable is required for neural search');
  }

  try {
    console.log(`Neural search: "${queryText}" (k=${k}, model=${MODEL_ID})`);

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          neural: {
            [VECTOR_FIELD]: {
              query_text: queryText,
              model_id: MODEL_ID,
              k: k
            }
          }
        },
        _source: ['payload']
      }
    });

    const hits = response.body.hits.hits || [];
    console.log(`Neural search returned ${hits.length} results`);

    return hits.map((hit: any) => ({
      profileId: hit._id,
      score: hit._score,
      matchPercentage: Math.round((hit._score || 0) * 100),
      // Map payload.* to top level for compatibility with existing code
      companyDetails: hit._source?.payload?.companyDetails,
      classification: hit._source?.payload?.classification,
      primaryContact: hit._source?.payload?.primaryContact,
    }));
  } catch (error) {
    console.error('Neural search error:', error);
    throw new Error('Failed to execute neural search');
  }
}

/**
 * Health check for the neural search service
 */
export async function neuralSearchHealthCheck(): Promise<boolean> {
  try {
    const health = await client.cluster.health();
    return health.body.status !== 'red';
  } catch (error) {
    console.error('Neural search health check failed:', error);
    return false;
  }
}
