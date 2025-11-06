#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const ES_URL = 'http://localhost:9200';
const ES_USER = 'elastic';
const ES_PASS = 'changeme';
const INDEX_NAME = 'company-profiles';

const auth = Buffer.from(`${ES_USER}:${ES_PASS}`).toString('base64');

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ES_URL + urlPath);
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function makeBulkRequest(ndjsonLines) {
  return new Promise((resolve, reject) => {
    const url = new URL(ES_URL + '/_bulk');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-ndjson',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(ndjsonLines);
    req.end();
  });
}

async function initElasticsearch() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Elasticsearch Index Initialization          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  try {
    // Check Elasticsearch connectivity
    console.log('1. Checking Elasticsearch connectivity...');
    const health = await makeRequest('GET', '/_cluster/health');
    if (health.status !== 200) {
      throw new Error(`Elasticsearch not responding: ${health.status}`);
    }
    console.log('   ✓ Elasticsearch is accessible\n');

    // Delete existing index if it exists
    console.log('2. Checking for existing index...');
    const indexCheck = await makeRequest('GET', `/${INDEX_NAME}`);
    if (indexCheck.status === 200) {
      console.log(`   Found existing index. Deleting...`);
      const deleteRes = await makeRequest('DELETE', `/${INDEX_NAME}`);
      if (deleteRes.status === 200) {
        console.log('   ✓ Index deleted\n');
      }
    } else {
      console.log('   No existing index found\n');
    }

    // Create index with mappings
    console.log('3. Creating index with mappings...');
    const mappingsPath = path.join(__dirname, '../elasticsearch/mappings.json');
    const mappingsContent = fs.readFileSync(mappingsPath, 'utf8');
    const mappingsFile = JSON.parse(mappingsContent);

    // Extract the actual mappings and settings from the template format
    const createRes = await makeRequest('PUT', `/${INDEX_NAME}`, mappingsFile.template);
    if (createRes.status !== 200) {
      throw new Error(`Failed to create index: ${JSON.stringify(createRes)}`);
    }
    console.log('   ✓ Index created successfully\n');

    // Load sample data
    console.log('4. Loading sample data...');
    const sampleDataPath = path.join(__dirname, '../elasticsearch/sample-data.ndjson');
    const ndjsonContent = fs.readFileSync(sampleDataPath, 'utf8');

    // Verify ndjson format before sending
    const lines = ndjsonContent.trim().split('\n').filter(line => line);
    console.log(`   Found ${lines.length} lines in ndjson file`);

    // Reconstruct proper ndjson with index commands for the correct index
    const bulkLines = [];
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        bulkLines.push(`{"index":{"_index":"${INDEX_NAME}"}}`);
        bulkLines.push(lines[i + 1]);
      }
    }
    const bulkPayload = bulkLines.join('\n') + '\n';

    const bulkRes = await makeBulkRequest(bulkPayload);

    if (bulkRes.data.errors) {
      console.log('   ⚠ Some documents failed to index:');
      bulkRes.data.items.forEach((item, idx) => {
        if (item.index.error) {
          console.log(`   Document ${idx}: ${item.index.error.reason}`);
        }
      });
    }

    const successCount = bulkRes.data.items ? bulkRes.data.items.filter(item => !item.index.error).length : 0;
    console.log(`   ✓ Successfully indexed ${successCount} documents\n`);

    // Wait for indexing to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify data
    console.log('5. Verifying indexed data...');
    const countRes = await makeRequest('GET', `/${INDEX_NAME}/_count`, {});
    if (countRes.status === 200) {
      const count = countRes.data.count;
      console.log(`   ✓ Total documents in index: ${count}\n`);
    }

    // Show sample query results
    console.log('6. Sample query results:');
    const searchRes = await makeRequest('GET', `/${INDEX_NAME}/_search?size=2`, {});
    if (searchRes.status === 200 && searchRes.data.hits) {
      searchRes.data.hits.hits.forEach((hit, idx) => {
        const company = hit._source.companyDetails;
        console.log(`   ${idx + 1}. ${company.companyName} (${company.country})`);
      });
    }

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  ✓ Initialization Complete                  ║');
    console.log('╚══════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}\n`);
    process.exit(1);
  }
}

initElasticsearch();
