import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import matchingService from '../services/matching.service';
import {
  ICPMatchRequest,
  ICPTemplate,
  ICPCriterion,
  createTemplate,
  createCriterion,
} from '../types/icp-template';

export default async function icpRoute(fastify: FastifyInstance) {
  /**
   * POST /api/icp/match
   * Match companies against an ICP template
   *
   * Request body:
   * {
   *   "template": {
   *     "id": "template-1",
   *     "name": "Dutch Tech Distributor",
   *     "criteria": [
   *       { "field": "country", "value": "Netherlands", "weight": 8, "scoringType": "geographic" },
   *       { "field": "profileType", "value": "Distributor", "weight": 7, "scoringType": "categorical" },
   *       { "field": "keywords", "value": ["tech", "audio"], "weight": 6, "scoringType": "semantic" }
   *     ]
   *   },
   *   "minThreshold": 30,
   *   "maxResults": 50
   * }
   */
  fastify.post<{ Body: ICPMatchRequest }>(
    '/match',
    async (request: FastifyRequest<{ Body: ICPMatchRequest }>, reply: FastifyReply) => {
      try {
        const result = await matchingService.matchWithICPTemplate(request.body);
        return result;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Failed to match with ICP template',
        });
      }
    }
  );

  /**
   * POST /api/icp/quick-match
   * Quick match with inline criteria (no template required)
   *
   * Request body:
   * {
   *   "criteria": {
   *     "country": "Netherlands",
   *     "profileType": "Distributor",
   *     "keywords": ["tech", "audio"],
   *     "numberOfEmployees": 100
   *   },
   *   "weights": {
   *     "country": 8,
   *     "profileType": 7,
   *     "keywords": 6,
   *     "numberOfEmployees": 4
   *   },
   *   "minThreshold": 30
   * }
   */
  fastify.post<{
    Body: {
      criteria: Record<string, any>;
      weights?: Record<string, number>;
      minThreshold?: number;
      maxResults?: number;
    };
  }>(
    '/quick-match',
    async (
      request: FastifyRequest<{
        Body: {
          criteria: Record<string, any>;
          weights?: Record<string, number>;
          minThreshold?: number;
          maxResults?: number;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { criteria, weights = {}, minThreshold, maxResults } = request.body;

        // Convert inline criteria to ICP template
        const icpCriteria: ICPCriterion[] = [];

        for (const [field, value] of Object.entries(criteria)) {
          if (value !== null && value !== undefined && value !== '') {
            icpCriteria.push(
              createCriterion(field, value, weights[field] || 5)
            );
          }
        }

        const template = createTemplate('Quick Match', icpCriteria);

        const result = await matchingService.matchWithICPTemplate({
          template,
          minThreshold,
          maxResults,
        });

        return result;
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Failed to perform quick match',
        });
      }
    }
  );

  /**
   * GET /api/icp/scoring-types
   * Get available scoring types and their descriptions
   */
  fastify.get('/scoring-types', async () => {
    return {
      scoringTypes: [
        {
          type: 'geographic',
          label: 'Geographic (Distance)',
          description:
            'Scores based on distance in km. 100% at same location, decreasing with distance.',
          applicableTo: ['country', 'city'],
        },
        {
          type: 'categorical',
          label: 'Categorical (Similarity)',
          description:
            'Uses predefined similarity matrices for categories like profileType and marketSegment.',
          applicableTo: ['profileType', 'marketSegment'],
        },
        {
          type: 'semantic',
          label: 'Semantic (Text)',
          description:
            'Text similarity using Levenshtein distance or embedding comparison.',
          applicableTo: ['keywords', 'servicesOffered', 'companyName', 'summaryOfActivity'],
        },
        {
          type: 'numeric',
          label: 'Numeric (Range)',
          description:
            'Ratio-based scoring for numeric values. 100 vs 200 = 50%, 100 vs 100 = 100%.',
          applicableTo: ['numberOfEmployees', 'annualTurnover'],
        },
        {
          type: 'exact',
          label: 'Exact Match',
          description: 'Binary match: 100% if identical, 0% otherwise.',
          applicableTo: ['any'],
        },
      ],
    };
  });

  /**
   * GET /api/icp/fields
   * Get available fields for ICP criteria
   */
  fastify.get('/fields', async () => {
    return {
      fields: [
        {
          name: 'country',
          label: 'Country',
          path: 'companyDetails.country',
          defaultScoringType: 'geographic',
          valueType: 'string',
        },
        {
          name: 'city',
          label: 'City',
          path: 'companyDetails.city',
          defaultScoringType: 'geographic',
          valueType: 'string',
        },
        {
          name: 'profileType',
          label: 'Profile Type',
          path: 'classification.profileType',
          defaultScoringType: 'categorical',
          valueType: 'string',
          examples: ['Distributor', 'Wholesaler', 'Manufacturer', 'Retailer', 'Consultant'],
        },
        {
          name: 'marketSegment',
          label: 'Market Segment',
          path: 'classification.marketSegment',
          defaultScoringType: 'categorical',
          valueType: 'string',
          examples: ['enterprise', 'mid-market', 'smb', 'startup'],
        },
        {
          name: 'keywords',
          label: 'Keywords',
          path: 'classification.keywords',
          defaultScoringType: 'semantic',
          valueType: 'array',
        },
        {
          name: 'servicesOffered',
          label: 'Services Offered',
          path: 'classification.servicesOffered',
          defaultScoringType: 'semantic',
          valueType: 'array',
        },
        {
          name: 'numberOfEmployees',
          label: 'Number of Employees',
          path: 'companyDetails.numberOfEmployees',
          defaultScoringType: 'numeric',
          valueType: 'number',
        },
        {
          name: 'annualTurnover',
          label: 'Annual Turnover',
          path: 'companyDetails.annualTurnover',
          defaultScoringType: 'numeric',
          valueType: 'number',
        },
        {
          name: 'companyName',
          label: 'Company Name',
          path: 'companyDetails.companyName',
          defaultScoringType: 'semantic',
          valueType: 'string',
        },
      ],
    };
  });

  /**
   * POST /api/icp/test-scoring
   * Test scoring between two values with a specific scoring type
   *
   * Request body:
   * {
   *   "value1": "Netherlands",
   *   "value2": "Germany",
   *   "scoringType": "geographic",
   *   "field": "country"
   * }
   */
  fastify.post<{
    Body: {
      value1: any;
      value2: any;
      scoringType: string;
      field?: string;
    };
  }>(
    '/test-scoring',
    async (
      request: FastifyRequest<{
        Body: {
          value1: any;
          value2: any;
          scoringType: string;
          field?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { value1, value2, scoringType, field } = request.body;

        // Import services for testing
        const { geographicService } = await import('../services/geographic.service');
        const { categoricalService } = await import('../services/categorical.service');

        let result: { score: number; explanation: string };

        switch (scoringType) {
          case 'geographic':
            const geoResult = geographicService.calculateProximityScore(
              String(value1),
              String(value2)
            );
            result = { score: geoResult.score, explanation: geoResult.explanation };
            break;

          case 'categorical':
            if (field?.includes('profileType')) {
              result = categoricalService.getProfileTypeSimilarity(
                String(value1),
                String(value2)
              );
            } else if (field?.includes('marketSegment')) {
              result = categoricalService.getMarketSegmentSimilarity(
                String(value1),
                String(value2)
              );
            } else {
              const match =
                String(value1).toLowerCase() === String(value2).toLowerCase();
              result = {
                score: match ? 100 : 30,
                explanation: match ? `Exact match` : `No predefined similarity`,
              };
            }
            break;

          case 'numeric':
            const num1 = Number(value1) || 0;
            const num2 = Number(value2) || 0;
            if (num1 === 0 || num2 === 0) {
              result = { score: 0, explanation: 'One value is 0' };
            } else {
              const max = Math.max(num1, num2);
              const min = Math.min(num1, num2);
              const score = Math.round((min / max) * 100);
              result = {
                score,
                explanation: `${num1} vs ${num2} = ${score}%`,
              };
            }
            break;

          case 'exact':
            const exactMatch =
              String(value1).toLowerCase() === String(value2).toLowerCase();
            result = {
              score: exactMatch ? 100 : 0,
              explanation: exactMatch
                ? `Exact match: "${value1}"`
                : `No match: "${value1}" ≠ "${value2}"`,
            };
            break;

          default:
            // Semantic/text similarity
            const levenshtein = (a: string, b: string): number => {
              const aa = a.toLowerCase();
              const bb = b.toLowerCase();
              const matrix: number[][] = [];
              for (let i = 0; i <= bb.length; i++) matrix[i] = [i];
              for (let j = 0; j <= aa.length; j++) matrix[0][j] = j;
              for (let i = 1; i <= bb.length; i++) {
                for (let j = 1; j <= aa.length; j++) {
                  matrix[i][j] =
                    bb.charAt(i - 1) === aa.charAt(j - 1)
                      ? matrix[i - 1][j - 1]
                      : Math.min(
                          matrix[i - 1][j - 1] + 1,
                          matrix[i][j - 1] + 1,
                          matrix[i - 1][j] + 1
                        );
                }
              }
              return matrix[bb.length][aa.length];
            };

            const str1 = String(value1);
            const str2 = String(value2);
            const distance = levenshtein(str1, str2);
            const maxLen = Math.max(str1.length, str2.length);
            const textScore =
              maxLen === 0 ? 100 : Math.round((1 - distance / maxLen) * 100);
            result = {
              score: textScore,
              explanation: `Text similarity: "${str1}" vs "${str2}" = ${textScore}%`,
            };
        }

        return {
          value1,
          value2,
          scoringType,
          field,
          ...result,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Failed to test scoring',
        });
      }
    }
  );
}
