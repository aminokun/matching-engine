import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import matchingService, { MatchRequest, SearchMatchRequest } from '../services/matching.service';
import elasticsearchService from '../services/elasticsearch.service';

export default async function matchRoute(fastify: FastifyInstance) {
  /**
   * POST /api/search-matches
   * Search for entities matching an ideal profile and return ranked results
   *
   * Request body:
   * {
   *   "idealProfile": {
   *     "country": "China",
   *     "profileType": "Distributor",
   *     "keywords": ["audio", "sound"],
   *     "textQuery": "distributor in China for audio"
   *   },
   *   "weights": [
   *     { "parameterName": "country", "weight": 40 },
   *     { "parameterName": "profileType", "weight": 30 },
   *     { "parameterName": "keywords", "weight": 30 }
   *   ],
   *   "minThreshold": 20
   * }
   */
  fastify.post<{ Body: SearchMatchRequest }>('/search-matches', async (request: FastifyRequest<{ Body: SearchMatchRequest }>, reply: FastifyReply) => {
    try {
      const result = await matchingService.searchAndRankMatches(request.body);
      return result;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Failed to search matches',
      });
    }
  });
  /**
   * POST /api/match
   * Calculate match between two entities with custom weights
   *
   * Request body:
   * {
   *   "entity1Id": "PROF-UK-83619",
   *   "entity2Id": "PROF-DE-45201",
   *   "weights": [
   *     { "parameterName": "country", "weight": 30 },
   *     { "parameterName": "marketSegment", "weight": 20 },
   *     { "parameterName": "numberOfEmployees", "weight": 30 },
   *     { "parameterName": "keywords", "weight": 20 }
   *   ]
   * }
   */
  fastify.post<{ Body: MatchRequest }>('/match', async (request: FastifyRequest<{ Body: MatchRequest }>, reply: FastifyReply) => {
    try {
      const result = await matchingService.matchWithCustomWeights(request.body);
      return result;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Failed to calculate match',
      });
    }
  });

  /**
   * GET /api/entities
   * List all available entities for matching
   *
   * Query parameters:
   * - limit: number (default: 100, max: 1000)
   */
  fastify.get<{ Querystring: { limit?: string } }>('/entities', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    try {
      const limit = Math.min(parseInt(request.query.limit || '100'), 1000);
      const entities = await elasticsearchService.getAllEntities(limit);

      return {
        total: await elasticsearchService.getEntityCount(),
        count: entities.length,
        entities: entities.map((entity) => ({
          profileId: entity.profileId,
          companyName: entity.companyDetails.companyName,
          country: entity.companyDetails.country,
          city: entity.companyDetails.city,
          profileType: entity.classification.profileType,
          marketSegment: entity.classification.marketSegment,
          numberOfEmployees: entity.companyDetails.numberOfEmployees,
          annualTurnover: entity.companyDetails.annualTurnover,
        })),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to fetch entities',
      });
    }
  });

  /**
   * GET /api/parameters
   * List available parameters for matching with their types
   */
  fastify.get('/parameters', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parameters = elasticsearchService.getAvailableParameters();

      return {
        count: parameters.length,
        parameters: parameters.map((param) => ({
          name: param.name,
          label: param.label,
          type: param.type,
        })),
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to fetch parameters',
      });
    }
  });

  /**
   * GET /api/entity/:profileId
   * Get a single entity by ID
   */
  fastify.get<{ Params: { profileId: string } }>('/entity/:profileId', async (request: FastifyRequest<{ Params: { profileId: string } }>, reply: FastifyReply) => {
    try {
      const entity = await elasticsearchService.getEntity(request.params.profileId);

      if (!entity) {
        return reply.status(404).send({
          error: 'Entity not found',
        });
      }

      return {
        profileId: entity.profileId,
        companyDetails: entity.companyDetails,
        classification: entity.classification,
        primaryContact: entity.primaryContact,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to fetch entity',
      });
    }
  });

  /**
   * POST /api/match/batch
   * Calculate matches for multiple entity pairs (useful for testing)
   *
   * Request body:
   * {
   *   "pairs": [
   *     { "entity1Id": "...", "entity2Id": "...", "weights": [...] },
   *     ...
   *   ]
   * }
   */
  fastify.post<{ Body: { pairs: MatchRequest[] } }>('/match/batch', async (request: FastifyRequest<{ Body: { pairs: MatchRequest[] } }>, reply: FastifyReply) => {
    try {
      const results = await Promise.all(
        request.body.pairs.map((pair) =>
          matchingService.matchWithCustomWeights(pair)
        )
      );

      return {
        count: results.length,
        results,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Failed to calculate matches',
      });
    }
  });
}
