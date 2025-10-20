import 'dotenv/config';
import { Client } from '@elastic/elasticsearch';
import embeddingService from '../src/services/embedding.service';
import * as fs from 'fs';
import * as path from 'path';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
});

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || 'company-profiles';

async function generateEmbeddings() {
  console.log('Starting embedding generation...');

  // Initialize embedding model
  await embeddingService.initialize();
  console.log('Embedding model initialized');

  // Read sample data
  const sampleDataPath = path.join(__dirname, '../../elasticsearch/sample-data.json');
  const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

  console.log(`Found ${sampleData.length} profiles to process`);

  // Process each profile
  for (const profile of sampleData) {
    console.log(`Processing: ${profile.companyDetails.companyName}...`);

    // Generate embedding
    const embedding = await embeddingService.embedCompanyProfile(profile);

    // Add embedding to profile
    const updatedProfile = {
      ...profile,
      semanticEmbedding: embedding,
    };

    // Index in Elasticsearch
    try {
      await client.index({
        index: INDEX_NAME,
        id: profile.profileId,
        document: updatedProfile,
        refresh: true,
      });

      console.log(`  ✓ Indexed with embedding (${embedding.length} dimensions)`);
    } catch (error) {
      console.error(`  ✗ Failed to index:`, error);
    }
  }

  console.log('\nEmbedding generation complete!');
  console.log(`Total profiles indexed: ${sampleData.length}`);

  // Verify
  const count = await client.count({ index: INDEX_NAME });
  console.log(`Elasticsearch document count: ${count.count}`);

  process.exit(0);
}

generateEmbeddings().catch((error) => {
  console.error('Error generating embeddings:', error);
  process.exit(1);
});
