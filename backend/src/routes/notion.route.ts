import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import notionService from '../services/notion.service';

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
}
