import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function testNotion() {
  console.log('🔍 Testing Notion API Connection...\n');

  try {
    // Test 1: Search without filter
    console.log('Test 1: Searching all objects...');
    const searchResponse = await (notion as any).search({
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    console.log(`✓ Found ${searchResponse.results.length} total objects\n`);

    // Log all results
    if (searchResponse.results.length > 0) {
      console.log('Results found:');
      searchResponse.results.forEach((result: any, idx: number) => {
        console.log(`  ${idx + 1}. ${result.object} - ${(result as any).title?.[0]?.plain_text || result.id}`);
      });
    } else {
      console.log('❌ No objects found in Notion!');
      console.log('   Make sure:');
      console.log('   1. NOTION_API_KEY is set correctly');
      console.log('   2. Your integration has access to at least one page/database');
      console.log('   3. The database is shared with your integration');
    }

    console.log('\n📊 Filtering for databases:');
    const databases = searchResponse.results.filter((r: any) => r.object === 'database');
    console.log(`Found ${databases.length} databases\n`);

    if (databases.length > 0) {
      databases.forEach((db: any) => {
        console.log(`✓ Database: ${(db as any).title?.[0]?.plain_text || db.id}`);
        console.log(`  ID: ${db.id}`);
        console.log(`  Icon: ${(db as any).icon?.emoji || 'none'}\n`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testNotion();
