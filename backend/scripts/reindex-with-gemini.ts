import { Client } from '@opensearch-project/opensearch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://192.168.189.161:9200',
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_NAME = process.env.OPENSEARCH_INDEX || 'company-profiles';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

/**
 * Convert document to text for embedding
 */
function documentToText(doc: any): string {
  const parts: string[] = [];

  if (doc.companyDetails) {
    const cd = doc.companyDetails;
    if (cd.companyName) parts.push(`Company: ${cd.companyName}`);
    if (cd.country) parts.push(`Country: ${cd.country}`);
    if (cd.city) parts.push(`City: ${cd.city}`);
    if (cd.summaryOfActivity) parts.push(`Activity: ${cd.summaryOfActivity}`);
  }

  if (doc.classification) {
    const cl = doc.classification;
    if (cl.profileType) parts.push(`Type: ${cl.profileType}`);
    if (cl.marketSegment) parts.push(`Market: ${cl.marketSegment}`);
    if (cl.keywords && Array.isArray(cl.keywords)) {
      parts.push(`Keywords: ${cl.keywords.join(', ')}`);
    }
    if (cl.servicesOffered && Array.isArray(cl.servicesOffered)) {
      parts.push(`Services: ${cl.servicesOffered.join(', ')}`);
    }
    if (cl.clientTypesServed && Array.isArray(cl.clientTypesServed)) {
      parts.push(`Clients: ${cl.clientTypesServed.join(', ')}`);
    }
  }

  return parts.join('. ');
}

/**
 * Generate embedding using Gemini
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

/**
 * Delete existing index
 */
async function deleteIndex(): Promise<void> {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (exists.body) {
      console.log(`Deleting existing index: ${INDEX_NAME}`);
      await client.indices.delete({ index: INDEX_NAME });
      console.log('Index deleted');
    }
  } catch (error) {
    console.log('Index does not exist or error deleting:', error);
  }
}

/**
 * Create index with new mapping (768 dimensions)
 */
async function createIndex(): Promise<void> {
  const mappingsPath = path.join(__dirname, '../../elasticsearch/mappings.json');
  const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
  const mappingsFile = JSON.parse(mappingsContent);

  console.log('Creating index with 768-dimension vectors...');
  await client.indices.create({
    index: INDEX_NAME,
    body: mappingsFile.template,
  });
  console.log('Index created');
}

/**
 * Fetch all documents from existing index (if exists)
 */
async function fetchAllDocuments(): Promise<any[]> {
  try {
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: 1000,
        query: { match_all: {} },
      },
    });
    return response.body.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    console.log('No existing documents found');
    return [];
  }
}

/**
 * Main reindexing function
 */
async function reindex() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Reindex with Gemini Embeddings              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY environment variable is not set!');
    console.log('Please add GEMINI_API_KEY=your_key to your .env file');
    process.exit(1);
  }

  try {
    // 1. Fetch existing documents
    console.log('1. Fetching existing documents...');
    const documents = await fetchAllDocuments();
    console.log(`   Found ${documents.length} documents`);

    if (documents.length === 0) {
      console.log('   No documents to reindex. Run seed-demo-data.ts first.');
      process.exit(0);
    }

    // 2. Delete and recreate index with new mapping
    console.log('\n2. Recreating index with 768-dimension vectors...');
    await deleteIndex();
    await createIndex();

    // 3. Generate embeddings and reindex each document
    console.log('\n3. Generating Gemini embeddings and indexing...');
    let successCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        // Generate text representation
        const text = documentToText(doc);
        console.log(`   [${i + 1}/${documents.length}] Embedding: ${doc.companyDetails?.companyName || doc.profileId}`);

        // Generate embedding
        const embedding = await generateEmbedding(text);

        // Add embedding to document
        const docWithEmbedding = {
          ...doc,
          semanticEmbedding: embedding,
        };

        // Index document
        await client.index({
          index: INDEX_NAME,
          body: docWithEmbedding,
        });

        successCount++;

        // Rate limiting - Gemini has API limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   Failed to process ${doc.profileId}:`, error);
      }
    }

    // 4. Refresh index
    console.log('\n4. Refreshing index...');
    await client.indices.refresh({ index: INDEX_NAME });

    // 5. Verify
    console.log('\n5. Verifying...');
    const countResponse = await client.count({ index: INDEX_NAME });
    console.log(`   Total documents indexed: ${countResponse.body.count}`);

    // Check a sample document for embedding
    const sampleResponse = await client.search({
      index: INDEX_NAME,
      body: {
        size: 1,
        _source: ['profileId', 'companyDetails.companyName', 'semanticEmbedding'],
        query: { match_all: {} },
      },
    });

    if (sampleResponse.body.hits.hits.length > 0) {
      const sample = sampleResponse.body.hits.hits[0]._source;
      const embeddingLength = sample.semanticEmbedding?.length || 0;
      console.log(`   Sample embedding dimensions: ${embeddingLength}`);
    }

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log(`║  ✓ Reindexing Complete: ${successCount}/${documents.length} documents     ║`);
    console.log('╚══════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('Reindexing failed:', error);
    process.exit(1);
  }
}

reindex();
