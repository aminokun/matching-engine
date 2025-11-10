import { Client } from '@notionhq/client';
import * as dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

interface DatabaseEntry {
  name: string;
  value: string;
  type: string;
  description: string;
}

const parameterSets: Record<string, DatabaseEntry[]> = {
  COUNTRIES: [
    { name: 'China', value: 'China', type: 'Location', description: 'Asia Pacific region' },
    { name: 'Germany', value: 'Germany', type: 'Location', description: 'Central Europe' },
    { name: 'Italy', value: 'Italy', type: 'Location', description: 'Southern Europe' },
    { name: 'Vietnam', value: 'Vietnam', type: 'Location', description: 'Southeast Asia' },
    { name: 'South Korea', value: 'South Korea', type: 'Location', description: 'East Asia' },
    { name: 'Netherlands', value: 'Netherlands', type: 'Location', description: 'Western Europe' },
    { name: 'India', value: 'India', type: 'Location', description: 'South Asia' },
    { name: 'United Kingdom', value: 'United Kingdom', type: 'Location', description: 'Northern Europe' },
    { name: 'France', value: 'France', type: 'Location', description: 'Western Europe' },
    { name: 'Singapore', value: 'Singapore', type: 'Location', description: 'Southeast Asia' },
    { name: 'Japan', value: 'Japan', type: 'Location', description: 'East Asia' },
    { name: 'Poland', value: 'Poland', type: 'Location', description: 'Central Europe' },
    { name: 'Belgium', value: 'Belgium', type: 'Location', description: 'Western Europe' },
    { name: 'Denmark', value: 'Denmark', type: 'Location', description: 'Northern Europe' },
    { name: 'United States', value: 'United States', type: 'Location', description: 'North America' },
    { name: 'Taiwan', value: 'Taiwan', type: 'Location', description: 'East Asia' },
    { name: 'Mexico', value: 'Mexico', type: 'Location', description: 'North America' },
    { name: 'Brazil', value: 'Brazil', type: 'Location', description: 'South America' },
    { name: 'Thailand', value: 'Thailand', type: 'Location', description: 'Southeast Asia' },
    { name: 'Indonesia', value: 'Indonesia', type: 'Location', description: 'Southeast Asia' },
  ],
  PROFILE_TYPES: [
    { name: 'Distributor', value: 'Distributor', type: 'BusinessType', description: 'Wholesale distribution company' },
    { name: 'Manufacturer', value: 'Manufacturer', type: 'BusinessType', description: 'Production facility' },
    { name: 'Retailer', value: 'Retailer', type: 'BusinessType', description: 'End consumer sales' },
    { name: 'Brand', value: 'Brand', type: 'BusinessType', description: 'Brand owner/designer' },
    { name: 'Exporter', value: 'Exporter', type: 'BusinessType', description: 'International export company' },
  ],
  MARKET_SEGMENTS: [
    { name: 'Electronics', value: 'Electronics', type: 'Industry', description: 'Consumer & industrial electronics' },
    { name: 'Industrial Machinery', value: 'Industrial Machinery', type: 'Industry', description: 'Heavy machinery & equipment' },
    { name: 'Textiles', value: 'Textiles', type: 'Industry', description: 'Fabrics & textile products' },
    { name: 'Fashion', value: 'Fashion', type: 'Industry', description: 'Apparel & fashion goods' },
    { name: 'FMCG', value: 'FMCG', type: 'Industry', description: 'Fast moving consumer goods' },
    { name: 'Automotive', value: 'Automotive', type: 'Industry', description: 'Vehicle parts & components' },
    { name: 'Chemicals', value: 'Chemicals', type: 'Industry', description: 'Chemical products & compounds' },
    { name: 'Healthcare', value: 'Healthcare', type: 'Industry', description: 'Medical devices & pharmaceuticals' },
    { name: 'Logistics', value: 'Logistics', type: 'Industry', description: 'Supply chain & transportation' },
    { name: 'Furniture', value: 'Furniture', type: 'Industry', description: 'Furniture & furnishings' },
    { name: 'Packaging', value: 'Packaging', type: 'Industry', description: 'Packaging materials & boxes' },
    { name: 'Energy', value: 'Energy', type: 'Industry', description: 'Renewable & traditional energy' },
    { name: 'Agriculture', value: 'Agriculture', type: 'Industry', description: 'Agricultural products & equipment' },
    { name: 'Beauty & Cosmetics', value: 'Beauty & Cosmetics', type: 'Industry', description: 'Beauty & skincare products' },
    { name: 'Construction', value: 'Construction', type: 'Industry', description: 'Building materials & supplies' },
  ],
  SERVICES_OFFERED: [
    { name: 'Manufacturing', value: 'Manufacturing', type: 'Service', description: 'Product manufacturing capability' },
    { name: 'Distribution', value: 'Distribution', type: 'Service', description: 'Wholesale distribution services' },
    { name: 'Wholesale', value: 'Wholesale', type: 'Service', description: 'Bulk sales to retailers' },
    { name: 'Retail', value: 'Retail', type: 'Service', description: 'Direct consumer sales' },
    { name: 'OEM Services', value: 'OEM Services', type: 'Service', description: 'Original equipment manufacturing' },
    { name: 'Export', value: 'Export', type: 'Service', description: 'International export capability' },
    { name: 'Logistics & Warehousing', value: 'Logistics & Warehousing', type: 'Service', description: 'Storage & logistics services' },
    { name: 'Installation & Support', value: 'Installation & Support', type: 'Service', description: 'Technical installation & support' },
    { name: 'Custom Solutions', value: 'Custom Solutions', type: 'Service', description: 'Customized product solutions' },
    { name: 'Quality Control', value: 'Quality Control', type: 'Service', description: 'QC & testing services' },
    { name: 'Design & Engineering', value: 'Design & Engineering', type: 'Service', description: 'Product design services' },
    { name: 'Technical Support', value: 'Technical Support', type: 'Service', description: 'After-sales technical support' },
  ],
  CLIENT_TYPES: [
    { name: 'Retailers', value: 'Retailers', type: 'Client', description: 'Retail store networks' },
    { name: 'Manufacturers', value: 'Manufacturers', type: 'Client', description: 'Manufacturing facilities' },
    { name: 'System Integrators', value: 'System Integrators', type: 'Client', description: 'Systems integration companies' },
    { name: 'Distributors', value: 'Distributors', type: 'Client', description: 'Wholesale distributors' },
    { name: 'OEM', value: 'OEM', type: 'Client', description: 'Original equipment manufacturers' },
    { name: 'Hospitals & Clinics', value: 'Hospitals & Clinics', type: 'Client', description: 'Healthcare facilities' },
    { name: 'Hotels & Restaurants', value: 'Hotels & Restaurants', type: 'Client', description: 'Hospitality sector' },
    { name: 'Construction Companies', value: 'Construction Companies', type: 'Client', description: 'Building contractors' },
    { name: 'Automotive Shops', value: 'Automotive Shops', type: 'Client', description: 'Auto repair & service' },
    { name: 'E-commerce Companies', value: 'E-commerce Companies', type: 'Client', description: 'Online retailers' },
  ],
};

async function createDatabase(dbName: string, entries: DatabaseEntry[]): Promise<string | null> {
  try {
    console.log(`\nCreating database: ${dbName}`);

    // Create the database
    const dbResponse = await (notion as any).databases.create({
      parent: {
        type: 'workspace',
        workspace: true,
      },
      title: [
        {
          type: 'text',
          text: {
            content: dbName,
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
          select: {
            options: [
              { name: 'Location', color: 'blue' },
              { name: 'BusinessType', color: 'green' },
              { name: 'Industry', color: 'purple' },
              { name: 'Service', color: 'orange' },
              { name: 'Client', color: 'pink' },
            ],
          },
        },
        Description: {
          rich_text: {},
        },
      },
    });

    const databaseId = dbResponse.id;
    console.log(`✓ Created database: ${dbName} (ID: ${databaseId})`);

    // Add entries to the database
    let addedCount = 0;
    for (const entry of entries) {
      try {
        await (notion as any).pages.create({
          parent: {
            database_id: databaseId,
            type: 'database_id',
          },
          properties: {
            Name: {
              title: [
                {
                  type: 'text',
                  text: {
                    content: entry.name,
                  },
                },
              ],
            },
            Value: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: entry.value,
                  },
                },
              ],
            },
            Type: {
              select: {
                name: entry.type,
              },
            },
            Description: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: entry.description,
                  },
                },
              ],
            },
          },
        });
        addedCount++;
      } catch (error) {
        console.error(`  ✗ Failed to add entry "${entry.name}":`, (error as any).message);
      }
    }

    console.log(`✓ Added ${addedCount}/${entries.length} entries to ${dbName}`);
    return databaseId;
  } catch (error) {
    console.error(`✗ Failed to create database ${dbName}:`, (error as any).message);
    return null;
  }
}

async function main() {
  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable not set');
    }

    console.log('🚀 Starting to create parameter databases in Notion...\n');
    console.log('This will create 5 databases with matching parameters:');
    console.log('  - COUNTRIES (20 entries)');
    console.log('  - PROFILE_TYPES (5 entries)');
    console.log('  - MARKET_SEGMENTS (15 entries)');
    console.log('  - SERVICES_OFFERED (12 entries)');
    console.log('  - CLIENT_TYPES (10 entries)');
    console.log('\nTotal: 62 parameter entries for matching\n');

    const results: Record<string, string | null> = {};

    for (const [dbName, entries] of Object.entries(parameterSets)) {
      const databaseId = await createDatabase(dbName, entries);
      results[dbName] = databaseId;

      // Add a small delay between database creations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CREATION SUMMARY');
    console.log('='.repeat(60));

    const successCount = Object.values(results).filter(id => id !== null).length;
    console.log(`✅ Successfully created ${successCount}/5 databases\n`);

    for (const [dbName, databaseId] of Object.entries(results)) {
      if (databaseId) {
        console.log(`✓ ${dbName}`);
        console.log(`  ID: ${databaseId}`);
      } else {
        console.log(`✗ ${dbName} (failed)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 NEXT STEPS');
    console.log('='.repeat(60));
    console.log(`
1. Go to your Notion workspace
2. The 5 new databases should now be visible:
   - COUNTRIES
   - PROFILE_TYPES
   - MARKET_SEGMENTS
   - SERVICES_OFFERED
   - CLIENT_TYPES

3. Share each database with your Notion integration:
   - Open each database
   - Click "Share" → find your integration
   - Grant "Read content" permissions

4. In the app, go to the Match page
5. Click "Add Parameter Set"
6. Select any of the 5 databases
7. You can now combine them for matching!

Example combinations:
   - Countries + Profile Types → find Distributors in Germany
   - Market Segments + Services → find Electronics manufacturers
   - Client Types + Services → find companies serving Retailers
    `);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', (error as any).message);
    process.exit(1);
  }
}

main();
