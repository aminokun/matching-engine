import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Singleton pattern for the embedding pipeline
class EmbeddingService {
  private static instance: EmbeddingService;
  private embedder: any = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2';
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(`Initializing embedding model: ${this.modelName}...`);
    const startTime = Date.now();

    this.embedder = await pipeline('feature-extraction', this.modelName);

    this.isInitialized = true;
    const duration = Date.now() - startTime;
    console.log(`Embedding model initialized in ${duration}ms`);
  }

  async embed(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Generate embedding with mean pooling and normalization
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to array
    return Array.from(output.data) as number[];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  async embedCompanyProfile(profile: any): Promise<number[]> {
    // Combine relevant fields for rich semantic representation
    const textParts: string[] = [
      profile.companyDetails?.companyName || '',
      profile.companyDetails?.summaryOfActivity || '',
      profile.classification?.profileType || '',
      ...(profile.classification?.marketSegment || []),
      ...(profile.classification?.keywords || []),
      ...(profile.classification?.servicesOffered || []),
    ];

    const text = textParts.filter(Boolean).join('. ');
    return this.embed(text);
  }
}

export default EmbeddingService.getInstance();
