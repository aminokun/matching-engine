import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import claudeService from '../services/claude.service';
import embeddingService from '../services/embedding.service';
import searchService from '../services/search.service';

// Request schema
const SearchRequestSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    profileType: z.string().optional(),
    marketSegment: z.array(z.string()).optional(),
    servicesOffered: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    employees: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    turnover: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
  includeExplanations: z.boolean().optional().default(true),
});

const searchRoute: FastifyPluginAsync = async (fastify) => {
  // Initialize embedding model on startup
  fastify.addHook('onReady', async () => {
    fastify.log.info('Initializing embedding model...');
    await embeddingService.initialize();
    fastify.log.info('Embedding model ready');
  });

  // Main search endpoint
  fastify.post('/search', async (request, reply) => {
    try {
      const body = SearchRequestSchema.parse(request.body);

      let searchParams;
      let queryEmbedding: number[] | undefined;

      // Natural language query path
      if (body.query) {
        fastify.log.info(`Processing natural language query: "${body.query}"`);

        // Extract parameters using Claude
        searchParams = await claudeService.extractSearchParameters(body.query);
        fastify.log.info(`Extracted parameters: ${JSON.stringify(searchParams)}`);

        // Generate embedding for semantic search
        const keywords = searchParams.keywords?.join(' ') || body.query;
        queryEmbedding = await embeddingService.embed(keywords);
        fastify.log.info('Generated query embedding');
      }
      // Structured filters path
      else if (body.filters) {
        fastify.log.info('Processing structured filters');
        searchParams = body.filters;

        // Generate embedding if keywords provided
        if (body.filters.keywords && body.filters.keywords.length > 0) {
          const keywords = body.filters.keywords.join(' ');
          queryEmbedding = await embeddingService.embed(keywords);
        }
      }
      // No query or filters
      else {
        return reply.code(400).send({
          error: 'Either query or filters must be provided',
        });
      }

      // Execute search
      const startTime = Date.now();
      const results = await searchService.search(searchParams, queryEmbedding);
      const searchDuration = Date.now() - startTime;

      fastify.log.info(`Search completed in ${searchDuration}ms, found ${results.length} results`);

      // Generate AI explanations if requested
      let explanations: Record<string, string> = {};
      if (body.includeExplanations && body.query && results.length > 0) {
        try {
          explanations = await claudeService.generateExplanation(body.query, results);
        } catch (error) {
          fastify.log.warn(`Failed to generate explanations: ${error}`);
        }
      }

      return reply.send({
        results,
        totalHits: results.length,
        took: searchDuration,
        query: body.query,
        extractedParams: searchParams,
        explanations: Object.keys(explanations).length > 0 ? explanations : undefined,
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

  // Health check for search services
  fastify.get('/search/health', async (request, reply) => {
    const esHealthy = await searchService.healthCheck();
    const embeddingReady = embeddingService['isInitialized'];

    const healthy = esHealthy && embeddingReady;

    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? 'healthy' : 'unhealthy',
      elasticsearch: esHealthy,
      embedding: embeddingReady,
    });
  });
};

export default searchRoute;
