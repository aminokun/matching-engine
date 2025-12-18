import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

class GeminiEmbeddingService {
  private model;
  private initialized = false;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set - embedding service will not work');
      return;
    }

    console.log('Gemini embedding service initialized');
    this.initialized = true;
  }

  /**
   * Generate embedding for a text string
   * Returns 768-dimensional vector
   */
  async embed(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Gemini embedding error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Convert a document object to text for embedding
   * Extracts all relevant fields and combines them
   */
  documentToText(doc: any): string {
    const parts: string[] = [];

    // Company details
    if (doc.companyDetails) {
      const cd = doc.companyDetails;
      if (cd.companyName) parts.push(`Company: ${cd.companyName}`);
      if (cd.country) parts.push(`Country: ${cd.country}`);
      if (cd.city) parts.push(`City: ${cd.city}`);
      if (cd.summaryOfActivity) parts.push(`Activity: ${cd.summaryOfActivity}`);
    }

    // Classification
    if (doc.classification) {
      const cl = doc.classification;
      if (cl.profileType) parts.push(`Type: ${cl.profileType}`);
      if (cl.marketSegment) parts.push(`Market: ${cl.marketSegment}`);
      if (cl.keywords && Array.isArray(cl.keywords)) {
        parts.push(`Keywords: ${cl.keywords.join(', ')}`);
      }
      if (cl.servicesOffered && Array.isArray(cl.servicesOffered)) {
        parts.push(`Services: ${cl.servicesOffered.join(', ')}`);
      }
      if (cl.clientTypesServed && Array.isArray(cl.clientTypesServed)) {
        parts.push(`Clients: ${cl.clientTypesServed.join(', ')}`);
      }
    }

    return parts.join('. ');
  }

  /**
   * Generate embedding for a document
   */
  async embedDocument(doc: any): Promise<number[]> {
    const text = this.documentToText(doc);
    return this.embed(text);
  }

  /**
   * Generate embedding for search query (filter values combined)
   */
  async embedQuery(filters: Record<string, any>): Promise<number[]> {
    // Combine all filter values into a search query
    const parts: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        parts.push(value.join(' '));
      } else if (typeof value === 'string' && value.trim()) {
        parts.push(value);
      } else if (typeof value === 'object') {
        // Handle nested objects like { min, max }
        const nested = Object.values(value).filter(v => v !== null && v !== undefined);
        if (nested.length > 0) {
          parts.push(`${key}: ${nested.join('-')}`);
        }
      }
    }

    const queryText = parts.join(' ');
    console.log('Embedding query:', queryText);
    return this.embed(queryText);
  }
}

export default new GeminiEmbeddingService();
