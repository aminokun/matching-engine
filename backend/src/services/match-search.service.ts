import elasticsearchService, { CompanyEntity } from './elasticsearch.service';

export interface IdealProfile {
  textQuery?: string;
  country?: string;
  profileType?: string;
  marketSegment?: string;
  keywords?: string[];
}

// A simple scoring function
const calculateScore = (baseEntity: CompanyEntity, candidateEntity: CompanyEntity, idealProfile: IdealProfile): number => {
  let score = 0;
  let maxScore = 0;

  // Country
  if (idealProfile.country) {
    maxScore += 1;
    if (candidateEntity.companyDetails.country === idealProfile.country) {
      score += 1;
    }
  }

  // Profile Type
  if (idealProfile.profileType) {
    maxScore += 1;
    if (candidateEntity.classification.profileType === idealProfile.profileType) {
      score += 1;
    }
  }

  // Market Segment
  if (idealProfile.marketSegment) {
    maxScore += 1;
    if (candidateEntity.classification.marketSegment === idealProfile.marketSegment) {
      score += 1;
    }
  }

  // Keywords
  if (idealProfile.keywords && idealProfile.keywords.length > 0) {
    maxScore += 1;
    const commonKeywords = candidateEntity.classification.keywords.filter(k => idealProfile.keywords?.includes(k));
    score += commonKeywords.length / idealProfile.keywords.length;
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
};

export const matchSearchService = async (entityId: string, idealProfile: IdealProfile) => {
  const baseEntity = await elasticsearchService.getEntity(entityId);

  if (!baseEntity) {
    throw new Error(`Entity with ID ${entityId} not found`);
  }

  const candidates = await elasticsearchService.searchByProfile(idealProfile);

  const scoredCandidates = candidates
    .filter(c => c.profileId !== entityId) // Exclude the base entity itself
    .map(candidate => ({
      company: candidate,
      score: calculateScore(baseEntity, candidate, idealProfile),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    baseEntity,
    matches: scoredCandidates,
  };
};
