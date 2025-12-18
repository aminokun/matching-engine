import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import searchService from '../services/search.service';
import elasticsearchService from '../services/elasticsearch.service';
import geminiEmbeddingService from '../services/gemini-embedding.service';

// Request schema - now accepts any dynamic filters
const SearchRequestSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
});

const searchRoute: FastifyPluginAsync = async (fastify) => {
  // Initialize Gemini embedding service on startup
  fastify.addHook('onReady', async () => {
    fastify.log.info('Initializing Gemini embedding service...');
    await geminiEmbeddingService.initialize();
    fastify.log.info('Gemini embedding service ready');
  });

  // Main search endpoint - pure vector search
  fastify.post('/search', async (request, reply) => {
    try {
      const body = SearchRequestSchema.parse(request.body);

      let queryText = '';

      // Natural language query
      if (body.query) {
        queryText = body.query;
        fastify.log.info(`Processing query: "${queryText}"`);
      }
      // Dynamic filters - convert to query text
      else if (body.filters && Object.keys(body.filters).length > 0) {
        fastify.log.info(`Processing filters: ${JSON.stringify(body.filters)}`);
        // Combine all filter values into search text
        const parts: string[] = [];
        for (const [key, value] of Object.entries(body.filters)) {
          if (value === null || value === undefined || value === '') continue;
          if (Array.isArray(value) && value.length > 0) {
            parts.push(value.join(' '));
          } else if (typeof value === 'string' && value.trim()) {
            parts.push(value);
          }
        }
        queryText = parts.join(' ');
        fastify.log.info(`Converted to query text: "${queryText}"`);
      }

      if (!queryText.trim()) {
        // Return all documents if no query
        const results = await searchService.getAllDocuments(20);
        return reply.send({
          results,
          totalHits: results.length,
          query: null,
        });
      }

      // Execute vector search
      const startTime = Date.now();
      const results = await searchService.vectorSearch(queryText);
      const searchDuration = Date.now() - startTime;

      fastify.log.info(`Search completed in ${searchDuration}ms, found ${results.length} results`);

      return reply.send({
        results,
        totalHits: results.length,
        took: searchDuration,
        query: queryText,
      });
    } catch (error: any) {
      fastify.log.error('Search error:', error);
      return reply.code(500).send({
        error: 'Search failed',
        message: error.message,
      });
    }
  });

  // Get single profile
  fastify.get('/profiles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const profile = await searchService.getProfile(id);

      if (!profile) {
        return reply.code(404).send({
          error: 'Profile not found',
        });
      }

      return reply.send({ profile });
    } catch (error: any) {
      fastify.log.error('Error fetching profile:', error);
      return reply.code(500).send({
        error: 'Failed to fetch profile',
        message: error.message,
      });
    }
  });

  // Get all entities
  fastify.get<{ Querystring: { limit?: string } }>('/entities', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    try {
      const limit = Math.min(parseInt(request.query.limit || '100'), 1000);
      const entities = await elasticsearchService.getAllEntities(limit);

      return {
        total: await elasticsearchService.getEntityCount(),
        count: entities.length,
        entities: entities.map((entity: any) => ({
          profileId: entity.profileId,
          companyName: entity.companyDetails?.companyName,
          country: entity.companyDetails?.country,
          city: entity.companyDetails?.city,
          profileType: entity.classification?.profileType,
          marketSegment: entity.classification?.marketSegment,
          numberOfEmployees: entity.companyDetails?.numberOfEmployees,
          annualTurnover: entity.companyDetails?.annualTurnover,
        })),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to fetch entities',
      });
    }
  });

  // Health check for search services
  fastify.get('/search/health', async (request, reply) => {
    const osHealthy = await searchService.healthCheck();

    return reply.code(osHealthy ? 200 : 503).send({
      status: osHealthy ? 'healthy' : 'unhealthy',
      opensearch: osHealthy,
      embeddingService: 'gemini',
    });
  });
};

export default searchRoute;
