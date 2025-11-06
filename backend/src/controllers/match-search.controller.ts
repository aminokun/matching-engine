import { FastifyRequest, FastifyReply } from 'fastify';
import { matchSearchService, IdealProfile } from '@/services/match-search.service';

export const matchSearchController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { entityId, idealProfile } = req.body as { entityId: string; idealProfile: IdealProfile };

    if (!entityId || !idealProfile) {
      return res.status(400).send({ error: 'entityId and idealProfile are required' });
    }

    const results = await matchSearchService(entityId, idealProfile);
    res.send(results);
  } catch (error) {
    console.error('Error in matchSearchController:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};
