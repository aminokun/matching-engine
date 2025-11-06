// types.ts

// Backend Response Types
export interface SearchResult {
  profileId: string;
  score: number;
  companyDetails: {
    companyName: string;
    country: string;
    city: string;
    numberOfEmployees: number;
    annualTurnover: number;
    summaryOfActivity: string;
  };
  classification: {
    profileType: string;
    marketSegment: string[];
    servicesOffered: string[];
    keywords: string[];
  };
  primaryContact: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface BackendResponse {
  results: SearchResult[];
  totalHits: number;
  took: number;
  query?: string;
  extractedParams?: Record<string, unknown>;
  explanations?: Record<string, string>;
}

// Legacy Company Type (for backward compatibility)
export interface Company {
  company: {
    company_id: string;
    company_name: string;
    country: string;
    legal_structure: string;
    employee_count_range: {
      min: number;
      max: number;
    };
    operating_regions: string[];
    keywords_activity: string[];
    keywords_catalog: string[];
    other_markers: string[];
    business_model: {
      online_shop: boolean;
      multi_brand_offering: boolean;
      product_categories: string[];
      consumer_prosumer_segment: boolean;
      target_segment: string;
    };
    client_types_served: string[];
    search_tags: string[];
    last_updated: string;
  };
}