import 'dotenv/config';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

interface DatabaseConfig {
  name: string;
  icon: string;
  entries: Array<{
    name: string;
    value?: string;
    type?: string;
    description?: string;
  }>;
}

const databases: DatabaseConfig[] = [
  {
    name: 'COUNTRIES',
    icon: '🌍',
    entries: [
      { name: 'Germany', value: 'Germany' },
      { name: 'China', value: 'China' },
      { name: 'Hong Kong', value: 'Hong Kong' },
      { name: 'France', value: 'France' },
      { name: 'Netherlands', value: 'Netherlands' },
      { name: 'Spain', value: 'Spain' },
      { name: 'United Kingdom', value: 'United Kingdom' },
      { name: 'Austria', value: 'Austria' },
      { name: 'Belgium', value: 'Belgium' },
      { name: 'Italy', value: 'Italy' },
    ],
  },
  {
    name: 'COMPANY-TYPE',
    icon: '🏢',
    entries: [
      { name: 'Distributor', value: 'Distributor', type: 'B2B', description: 'Wholesale distributor' },
      { name: 'Manufacturer', value: 'Manufacturer', type: 'B2B', description: 'Product manufacturer' },
      { name: 'Wholesaler', value: 'Wholesaler', type: 'B2B', description: 'Bulk goods wholesaler' },
      { name: 'Retailer', value: 'Retailer', type: 'B2C', description: 'Retail sales' },
      { name: 'Installer', value: 'Installer', type: 'Service', description: 'Installation services' },
    ],
  },
  {
    name: 'MARKET-SEGMENT',
    icon: '📊',
    entries: [
      { name: 'small-business', value: 'small-business', description: '1-50 employees' },
      { name: 'mid-market', value: 'mid-market', description: '51-500 employees' },
      { name: 'enterprise', value: 'enterprise', description: '500+ employees' },
    ],
  },
  {
    name: 'KEYWORDS',
    icon: '🏷️',
    entries: [
      { name: 'audio', value: 'audio' },
      { name: 'sound', value: 'sound' },
      { name: 'lighting', value: 'lighting' },
      { name: 'AV equipment', value: 'AV equipment' },
      { name: 'event technology', value: 'event technology' },
      { name: 'professional', value: 'professional' },
      { name: 'B2B', value: 'B2B' },
      { name: 'distribution', value: 'distribution' },
      { name: 'wholesale', value: 'wholesale' },
      { name: 'retail', value: 'retail' },
    ],
  },
];

async function createNotionDatabases() {
  console.log('🚀 Starting to create Notion databases...\n');

  for (const dbConfig of databases) {
    try {
      console.log(`Creating database: ${dbConfig.icon} ${dbConfig.name}`);

      // Create the database
      const response = await (notion as any).databases.create({
        parent: {
          type: 'workspace',
          workspace: true,
        },
        icon: {
          type: 'emoji',
          emoji: dbConfig.icon,
        },
        title: [
          {
            type: 'text',
            text: {
              content: dbConfig.name,
            },
          },
        ],
        properties: {
          Name: {
            title: {},
          },
          Value: {
            rich_text: {},
          },
          Type: {
            rich_text: {},
          },
          Description: {
            rich_text: {},
          },
        },
      });

      const databaseId = response.id;
      console.log(`✅ Created database: ${databaseId}`);

      // Add entries to the database
      for (const entry of dbConfig.entries) {
        await (notion as any).pages.create({
          parent: {
            database_id: databaseId,
          },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: entry.name,
                  },
                },
              ],
            },
            Value: {
              rich_text: [
                {
                  text: {
                    content: entry.value || entry.name,
                  },
                },
              ],
            },
            Type: {
              rich_text: [
                {
                  text: {
                    content: entry.type || '',
                  },
                },
              ],
            },
            Description: {
              rich_text: [
                {
                  text: {
                    content: entry.description || '',
                  },
                },
              ],
            },
          },
        });
      }

      console.log(`   Added ${dbConfig.entries.length} entries\n`);
    } catch (error) {
      console.error(`❌ Error creating ${dbConfig.name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('✨ Done! Now go to Notion and connect these databases to your integration:');
  console.log('1. Open each database');
  console.log('2. Click "..." (top right)');
  console.log('3. Scroll down and click "Connections"');
  console.log('4. Find and click your integration');
  console.log('5. Click "Confirm"\n');
}

createNotionDatabases();
