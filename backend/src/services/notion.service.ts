import { Client } from '@notionhq/client';

let notion: Client | null = null;

if (process.env.NOTION_API_KEY) {
  notion = new Client({
    auth: process.env.NOTION_API_KEY,
  });
}

export interface NotionDatabase {
  id: string;
  name: string;
  icon?: string;
}

export interface NotionParameter {
  id: string;
  name: string;
  value?: string;
  type?: string;
  description?: string;
}

class NotionService {
  /**
   * Get all accessible databases from Notion workspace
   */
  async getAvailableDatabases(): Promise<NotionDatabase[]> {
    try {
      if (!notion) {
        console.warn('NOTION_API_KEY not configured');
        return [];
      }

      // Using search API to find all objects, then filter for databases
      const response = await (notion as any).search({
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      });

      const databases: NotionDatabase[] = response.results
        .filter((result: any) => result.object === 'database' || result.object === 'data_source')
        .map((db: any) => ({
          id: db.id,
          name: (db as any).title?.[0]?.plain_text || db.id,
          icon: (db as any).icon?.emoji || ((db as any).icon?.type === 'emoji' ? (db as any).icon.emoji : undefined),
        }));

      return databases;
    } catch (error) {
      console.error('Failed to fetch Notion databases:', error);
      return [];
    }
  }

  /**
   * Get all content from a specific Notion database
   */
  async getDatabaseContent(databaseId: string): Promise<NotionParameter[]> {
    try {
      if (!notion) {
        throw new Error('Notion API not configured');
      }

      let response;

      try {
        // Try to query as a regular database first
        console.log(`Querying database: ${databaseId}`);
        response = await (notion as any).databases.query({
          database_id: databaseId,
        });
        console.log(`Successfully queried database, found ${response.results.length} pages`);
        console.log(`[DEBUG] Response structure:`, {
          resultCount: response.results.length,
          hasHasMore: response.has_more,
          responseKeys: Object.keys(response),
        });
        if (response.results.length > 0) {
          console.log(`[DEBUG] First page properties:`, Object.keys(response.results[0].properties || {}));
        }
      } catch (e: any) {
        console.error(`Failed to query database directly:`, e.message);
        console.error(`[DEBUG] Error details:`, e);
        // If that fails, try to retrieve as a data source and query differently
        // For inline databases (data_source), we need to use a different approach
        console.log(`[DEBUG] Falling back to search API...`);
        const searchResponse = await (notion as any).search({
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time',
          },
        });

        console.log(`[DEBUG] Search found ${searchResponse.results.length} total results`);

        // Find the database
        const db = searchResponse.results.find((r: any) => r.id === databaseId);
        console.log(`Found data_source:`, db ? 'yes' : 'no');
        if (db) {
          console.log(`[DEBUG] Database info:`, { id: db.id, object: db.object, title: (db as any).title });
        }

        // Find pages that belong to this specific database
        const dbPages = searchResponse.results.filter((r: any) => {
          // Pages that are children of this specific database
          if (r.object !== 'page') {
            console.log(`[DEBUG] Skipping non-page:`, { object: r.object, id: r.id });
            return false;
          }

          // Check if the page's parent is this database
          const pageParent = (r as any).parent;

          // Handle both regular databases (type: 'database_id') and inline databases (type: 'data_source_id')
          if (pageParent) {
            let parentId: string | undefined;

            if (pageParent.type === 'database_id') {
              // Regular database - use database_id
              parentId = pageParent.database_id;
            } else if (pageParent.type === 'data_source_id') {
              // Inline database - use data_source_id
              parentId = pageParent.data_source_id;
            }

            if (parentId) {
              // Normalize IDs by removing dashes for comparison
              // Notion sometimes returns IDs with dashes, sometimes without
              const normalizedParentId = parentId.replace(/-/g, '');
              const normalizedDatabaseId = databaseId.replace(/-/g, '');
              const matches = normalizedParentId === normalizedDatabaseId;

              if (!matches) {
                console.log(`[DEBUG] ID mismatch:`, {
                  pageId: r.id,
                  parentType: pageParent.type,
                  parentId: parentId,
                  normalizedParent: normalizedParentId,
                  normalizedTarget: normalizedDatabaseId,
                });
              }
              return matches;
            }
          }

          console.log(`[DEBUG] Page has no valid parent:`, { pageId: r.id, parent: pageParent });
          return false;
        });

        console.log(`Found ${dbPages.length} pages for database ${databaseId}`);
        response = {
          results: dbPages,
        };
      }

      const parameters: NotionParameter[] = response.results
        .map((page: any, pageIndex: number) => {
          const properties = page.properties || {};

          console.log(`[DEBUG] Page ${pageIndex}:`, {
            id: page.id,
            propertyNames: Object.keys(properties),
          });

          let name = '';
          let value = '';
          let type = '';
          let description = '';

          // Extract from standard property names
          for (const [propName, prop] of Object.entries(properties as any)) {
            const propData = prop as any;

            // Title property
            if (propData.type === 'title' && propData.title?.length > 0) {
              name = propData.title[0].plain_text;
            }

            // Name field
            if (
              propName.toLowerCase() === 'name' &&
              propData.type === 'rich_text' &&
              propData.rich_text?.length > 0
            ) {
              if (!name) name = propData.rich_text[0].plain_text;
            }

            // Value field
            if (
              propName.toLowerCase() === 'value' &&
              (propData.type === 'rich_text' || propData.type === 'select')
            ) {
              if (propData.type === 'rich_text' && propData.rich_text?.length > 0) {
                value = propData.rich_text[0].plain_text;
              } else if (propData.type === 'select' && propData.select) {
                value = propData.select.name;
              }
            }

            // Type field
            if (propName.toLowerCase() === 'type' && propData.type === 'select') {
              type = propData.select?.name || '';
            }

            // Description field
            if (
              propName.toLowerCase() === 'description' &&
              propData.type === 'rich_text' &&
              propData.rich_text?.length > 0
            ) {
              description = propData.rich_text[0].plain_text;
            }
          }

          return {
            id: page.id,
            name: name || value || page.id,
            value: value || name,
            type: type || 'text',
            description,
          };
        })
        .filter((param: NotionParameter) => param.name && param.name.length > 0);

      return parameters;
    } catch (error) {
      console.error(`Failed to fetch Notion database content for ${databaseId}:`, error);
      throw new Error(`Failed to fetch database content`);
    }
  }

  /**
   * Get schema/properties of a Notion database
   */
  async getDatabaseSchema(databaseId: string): Promise<any> {
    try {
      if (!notion) {
        throw new Error('Notion API not configured');
      }

      const response = await (notion as any).databases.retrieve({
        database_id: databaseId,
      });

      return {
        id: response.id,
        title: (response as any).title?.[0]?.plain_text || 'Untitled',
        properties: (response as any).properties,
      };
    } catch (error) {
      console.error(`Failed to fetch Notion database schema for ${databaseId}:`, error);
      throw new Error('Failed to fetch database schema');
    }
  }
}

export default new NotionService();
