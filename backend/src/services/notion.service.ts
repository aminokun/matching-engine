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

export interface ParameterMatchResult {
  parameterName: string;
  parameterLabel: string;
  type: 'exact' | 'numeric' | 'text' | 'semantic';
  matchPercentage: number;
  value1: any;
  value2: any;
  explanation: string;
}

export interface CompanyDetailsForExport {
  companyName: string;
  country?: string;
  city?: string;
  summaryOfActivity?: string;
  dateEstablished?: string;
  numberOfEmployees?: number;
  annualTurnover?: number;
  website?: string;
  linkedinPage?: string;
  telephone?: string;
  generalEmail?: string;
}

export interface ClassificationForExport {
  profileType?: string;
  marketSegment?: string;
  keywords?: string[];
  servicesOffered?: string[];
  clientTypesServed?: string[];
}

export interface PrimaryContactForExport {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  gender?: string;
  email?: string;
  telephone?: string;
  linkedinPage?: string;
  type?: string;
}

export interface ExportCompanyData {
  profileId: string;
  matchPercentage: number;
  companyDetails: CompanyDetailsForExport;
  classification: ClassificationForExport;
  primaryContact: PrimaryContactForExport;
  parameterMatches: ParameterMatchResult[];
  ingestionDate: string;
  source: string;
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

  /**
   * Export a company to Notion as a new page
   */
  async exportCompanyToNotion(company: ExportCompanyData): Promise<string> {
    try {
      if (!notion) {
        throw new Error('Notion API not configured');
      }

      const databaseId = process.env.NOTION_EXPORT_DATABASE_ID;
      if (!databaseId) {
        throw new Error('NOTION_EXPORT_DATABASE_ID not configured in environment');
      }

      // Build the page content with grouped rich text structure
      const { title, children } = this.buildNotionPageContent(company);

      // Create the page
      const response = await (notion as any).pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title,
                },
              },
            ],
          },
        },
        children: children,
      });

      console.log(`Successfully exported company ${company.profileId} to Notion`);
      return response.id;
    } catch (error) {
      console.error(`Failed to export company to Notion:`, error);
      throw error;
    }
  }

  /**
   * Helper method to build grouped rich text content for Notion page
   */
  private buildNotionPageContent(company: ExportCompanyData): {
    title: string;
    children: any[];
  } {
    const { companyDetails, classification, primaryContact, parameterMatches, matchPercentage, profileId, source, ingestionDate } = company;
    const children: any[] = [];

    // Helper function to add heading
    const addHeading = (text: string, level: 1 | 2 | 3) => {
      const key = `heading_${level}`;
      children.push({
        object: 'block',
        type: key,
        [key]: {
          rich_text: [{ type: 'text', text: { content: text } }],
          color: 'default',
          is_toggleable: false,
        },
      });
    };

    // Helper function to add paragraph
    const addParagraph = (text: string, isCallout = false) => {
      if (!text) return;
      const chunk = { type: 'text', text: { content: text.substring(0, 2000) } };
      if (isCallout) {
        children.push({
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [chunk],
            icon: { type: 'emoji', emoji: '💡' },
            color: 'blue_background',
          },
        });
      } else {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [chunk],
            color: 'default',
          },
        });
      }
    };

    // Title: Company Name + Match %
    const title = `${companyDetails.companyName || 'Unknown Company'} - ${matchPercentage}% Match`;

    // Company Overview Section
    addHeading('Company Overview', 2);
    const overviewText = [
      companyDetails.country && `Location: ${companyDetails.country}${companyDetails.city ? ', ' + companyDetails.city : ''}`,
      classification.profileType && `Profile Type: ${classification.profileType}`,
      classification.marketSegment && `Market Segment: ${classification.marketSegment}`,
      companyDetails.summaryOfActivity && `Summary: ${companyDetails.summaryOfActivity}`,
    ]
      .filter(Boolean)
      .join('\n');
    if (overviewText) addParagraph(overviewText);

    // Business Details Section
    addHeading('Business Details', 2);
    const detailsText = [
      companyDetails.numberOfEmployees && `Employees: ${companyDetails.numberOfEmployees}`,
      companyDetails.annualTurnover && `Annual Turnover: $${companyDetails.annualTurnover.toLocaleString()}`,
      companyDetails.website && `Website: ${companyDetails.website}`,
      companyDetails.dateEstablished && `Established: ${companyDetails.dateEstablished}`,
      companyDetails.generalEmail && `Email: ${companyDetails.generalEmail}`,
      companyDetails.telephone && `Phone: ${companyDetails.telephone}`,
    ]
      .filter(Boolean)
      .join('\n');
    if (detailsText) addParagraph(detailsText);

    // Classification Section
    if (classification.keywords?.length || classification.servicesOffered?.length || classification.clientTypesServed?.length) {
      addHeading('Classification', 2);
      const classText = [
        classification.keywords?.length && `Keywords: ${classification.keywords.join(', ')}`,
        classification.servicesOffered?.length && `Services: ${classification.servicesOffered.join(', ')}`,
        classification.clientTypesServed?.length && `Clients Served: ${classification.clientTypesServed.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');
      if (classText) addParagraph(classText);
    }

    // Match Breakdown Section
    if (parameterMatches.length > 0) {
      addHeading('Match Breakdown', 2);
      parameterMatches.forEach((match) => {
        const matchText = `${match.parameterLabel}: ${match.matchPercentage}% match (${match.type})`;
        addParagraph(matchText);
        if (match.explanation) {
          addParagraph(`  └─ ${match.explanation}`, false);
        }
      });
    }

    // Primary Contact Section
    if (primaryContact.firstName || primaryContact.lastName || primaryContact.email || primaryContact.telephone) {
      addHeading('Primary Contact', 2);
      const contactText = [
        (primaryContact.firstName || primaryContact.lastName) && `Name: ${[primaryContact.firstName, primaryContact.lastName].filter(Boolean).join(' ')}`,
        primaryContact.jobTitle && `Position: ${primaryContact.jobTitle}`,
        primaryContact.email && `Email: ${primaryContact.email}`,
        primaryContact.telephone && `Phone: ${primaryContact.telephone}`,
        primaryContact.linkedinPage && `LinkedIn: ${primaryContact.linkedinPage}`,
      ]
        .filter(Boolean)
        .join('\n');
      if (contactText) addParagraph(contactText);
    }

    // Metadata Footer
    addHeading('Metadata', 3);
    const metaText = `ID: ${profileId} | Source: ${source} | Ingested: ${ingestionDate} | Exported: ${new Date().toISOString()}`;
    addParagraph(metaText);

    return { title, children };
  }
}

export default new NotionService();
