import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import notionService, { ExportCompanyData } from '../services/notion.service';

export default async function notionRoute(fastify: FastifyInstance) {
  /**
   * GET /api/notion/databases
   * List all accessible Notion databases
   */
  fastify.get('/notion/databases', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const databases = await notionService.getAvailableDatabases();
      return {
        databases,
        count: databases.length,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to fetch Notion databases',
      });
    }
  });

  /**
   * GET /api/notion/database/:id
   * Get content of a specific Notion database
   */
  fastify.get<{ Params: { id: string } }>(
    '/notion/database/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        if (!id) {
          return reply.status(400).send({
            error: 'Database ID is required',
          });
        }

        const content = await notionService.getDatabaseContent(id);
        return {
          databaseId: id,
          parameters: content,
          count: content.length,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to fetch database content',
        });
      }
    }
  );

  /**
   * GET /api/notion/database/:id/schema
   * Get schema/properties of a Notion database
   */
  fastify.get<{ Params: { id: string } }>(
    '/notion/database/:id/schema',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        if (!id) {
          return reply.status(400).send({
            error: 'Database ID is required',
          });
        }

        const schema = await notionService.getDatabaseSchema(id);
        return schema;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to fetch database schema',
        });
      }
    }
  );

  /**
   * POST /api/notion/databases/batch
   * Get content from multiple Notion databases at once
   *
   * Request body:
   * {
   *   "databaseIds": ["db-id-1", "db-id-2"]
   * }
   */
  fastify.post<{ Body: { databaseIds: string[] } }>(
    '/notion/databases/batch',
    async (request: FastifyRequest<{ Body: { databaseIds: string[] } }>, reply: FastifyReply) => {
      try {
        const { databaseIds } = request.body;

        if (!databaseIds || databaseIds.length === 0) {
          return reply.status(400).send({
            error: 'databaseIds array is required',
          });
        }

        const results = await Promise.all(
          databaseIds.map(async (id) => {
            try {
              const content = await notionService.getDatabaseContent(id);
              return {
                databaseId: id,
                parameters: content,
                success: true,
              };
            } catch (error) {
              return {
                databaseId: id,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch',
              };
            }
          })
        );

        return {
          results,
          successCount: results.filter((r) => r.success).length,
          failureCount: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to fetch batch databases',
        });
      }
    }
  );

  /**
   * POST /api/notion/export
   * Export matched companies to Notion database
   *
   * Request body:
   * {
   *   "companies": [ExportCompanyData, ...]
   * }
   *
   * Response:
   * {
   *   "success": boolean,
   *   "exported": number,
   *   "failed": number,
   *   "results": [
   *     {
   *       "profileId": string,
   *       "pageId": string (if successful),
   *       "error": string (if failed)
   *     }
   *   ]
   * }
   */
  fastify.post<{ Body: { companies: ExportCompanyData[] } }>(
    '/notion/export',
    async (request: FastifyRequest<{ Body: { companies: ExportCompanyData[] } }>, reply: FastifyReply) => {
      try {
        const { companies } = request.body;

        if (!companies || companies.length === 0) {
          return reply.status(400).send({
            error: 'companies array is required',
          });
        }

        const results: Array<{
          profileId: string;
          pageId?: string;
          error?: string;
        }> = [];

        // Export companies sequentially with rate limiting (350ms delay)
        for (const company of companies) {
          try {
            const pageId = await notionService.exportCompanyToNotion(company);
            results.push({
              profileId: company.profileId,
              pageId,
            });
            // Add delay between exports to respect Notion API rate limits (3 requests/sec)
            // 350ms ensures we stay within the limit
            if (companies.indexOf(company) < companies.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 350));
            }
          } catch (error) {
            results.push({
              profileId: company.profileId,
              error: error instanceof Error ? error.message : 'Failed to export company',
            });
          }
        }

        const exportedCount = results.filter((r) => r.pageId).length;
        const failedCount = results.filter((r) => r.error).length;

        return {
          success: failedCount === 0,
          exported: exportedCount,
          failed: failedCount,
          results,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to export companies',
        });
      }
    }
  );
}
