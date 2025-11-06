import { FastifyInstance } from 'fastify';
import { matchSearchController } from '@/controllers/match-search.controller';

export default async function (fastify: FastifyInstance) {
  fastify.post('/match-search', matchSearchController);
}
