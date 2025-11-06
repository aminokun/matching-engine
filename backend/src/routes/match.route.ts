import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import matchingService, { MatchRequest, SearchMatchRequest } from '../services/matching.service';
import elasticsearchService from '../services/elasticsearch.service';
import claudeService from '../services/claude.service';

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
   * POST /api/match/batch
   * Calculate matches for multiple entity pairs (useful for testing)
   *
   * Request body:
   * {
   *   "pairs": [
   *     { "entity1Id": "...", "entity2Id": "...", "weights": [...] },
   *     ..
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

  /**
   * POST /api/extract-parameters
   * Extract structured parameters from natural language query
   *
   * Request body:
   * {
   *   "query": "distributor in germany for audio equipment"
   * }
   */
  fastify.post<{ Body: { query: string } }>('/extract-parameters', async (request: FastifyRequest<{ Body: { query: string } }>, reply: FastifyReply) => {
    try {
      if (!request.body.query || request.body.query.trim().length === 0) {
        return {
          country: null,
          profileType: null,
          marketSegment: null,
          keywords: null,
        };
      }

      const extractedParams = await claudeService.extractSearchParameters(request.body.query);
      return extractedParams;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Failed to extract parameters',
      });
    }
  });
}
