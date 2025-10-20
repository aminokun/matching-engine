import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Schema for extracted search parameters
export const SearchParamsSchema = z.object({
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  profileType: z.string().nullable().optional(),
  marketSegment: z.array(z.string()).nullable().optional(),
  servicesOffered: z.array(z.string()).nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  employees: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  turnover: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

const EXTRACTION_PROMPT = `You are a search parameter extraction assistant. Extract structured search parameters from natural language queries about company profiles.

Return a JSON object with these fields (set to null if not mentioned):
- country: string (e.g., "Germany", "Netherlands")
- city: string
- profileType: string (e.g., "Distributor", "Manufacturer", "Wholesaler")
- marketSegment: string[] (e.g., ["enterprise", "mid-market"])
- servicesOffered: string[] (e.g., ["Technical Support", "Logistics"])
- keywords: string[] (industry terms, technologies, product categories)
- employees: {min: number, max: number} (employee count range)
- turnover: {min: number, max: number} (annual turnover in euros)

Examples:

Query: "Find distributors in Germany for professional lighting equipment"
Response: {
  "country": "Germany",
  "profileType": "Distributor",
  "keywords": ["professional lighting", "lighting equipment"]
}

Query: "Looking for cloud software companies in Netherlands with 50-200 employees"
Response: {
  "country": "Netherlands",
  "keywords": ["cloud software", "SaaS"],
  "employees": {"min": 50, "max": 200}
}

Query: "Enterprise-level distributors offering technical support for audio equipment"
Response: {
  "profileType": "Distributor",
  "marketSegment": ["enterprise"],
  "servicesOffered": ["Technical Support"],
  "keywords": ["audio equipment"]
}

Now extract parameters from this query:`;

class ClaudeService {
  // Simple keyword-based fallback (no API required)
  private extractParametersSimple(query: string): SearchParams {
    const lowerQuery = query.toLowerCase();
    const params: SearchParams = {};

    // Extract countries
    const countries = [
      "germany",
      "netherlands",
      "france",
      "spain",
      "united kingdom",
      "uk",
      "belgium",
      "italy",
    ];
    for (const country of countries) {
      if (lowerQuery.includes(country)) {
        params.country =
          country === "uk"
            ? "United Kingdom"
            : country.charAt(0).toUpperCase() + country.slice(1);
        break;
      }
    }

    // Extract profile types
    if (lowerQuery.includes("distributor")) params.profileType = "Distributor";
    else if (lowerQuery.includes("manufacturer"))
      params.profileType = "Manufacturer";
    else if (lowerQuery.includes("wholesaler"))
      params.profileType = "Wholesaler";

    // Extract market segments
    const segments: string[] = [];
    if (lowerQuery.includes("enterprise")) segments.push("enterprise");
    if (lowerQuery.includes("mid-market") || lowerQuery.includes("midmarket"))
      segments.push("mid-market");
    if (
      lowerQuery.includes("small business") ||
      lowerQuery.includes("small-business")
    )
      segments.push("small-business");
    if (segments.length > 0) params.marketSegment = segments;

    // Extract services
    const services: string[] = [];
    if (lowerQuery.includes("technical support"))
      services.push("Technical Support");
    if (lowerQuery.includes("logistics")) services.push("Logistics");
    if (lowerQuery.includes("installation"))
      services.push("Installation Services");
    if (lowerQuery.includes("training")) services.push("Training");
    if (services.length > 0) params.servicesOffered = services;

    // Extract employee ranges
    const employeeMatch = lowerQuery.match(
      /(\d+)[-\s]?(?:to|-|\s)?(\d+)?\s*(?:employees|people|staff)/
    );
    if (employeeMatch) {
      params.employees = {
        min: parseInt(employeeMatch[1]),
        max: employeeMatch[2] ? parseInt(employeeMatch[2]) : null,
      };
    }

    // Extract keywords (remove common words)
    const keywords: string[] = [];
    const keywordPatterns = [
      "lighting",
      "audio",
      "sound",
      "video",
      "av",
      "led",
      "professional",
      "equipment",
      "dj",
      "event",
      "broadcast",
      "rental",
      "cloud",
      "software",
      "saas",
    ];
    for (const keyword of keywordPatterns) {
      if (lowerQuery.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    if (keywords.length > 0) params.keywords = keywords;

    return params;
  }

  async extractSearchParameters(query: string): Promise<SearchParams> {
    const provider = process.env.LLM_PROVIDER;

    // Try Claude API
    if (
      provider === "claude" &&
      process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")
    ) {
      try {
        console.log("Using Claude API for parameter extraction");
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `${EXTRACTION_PROMPT}\n\n"${query}"`,
            },
          ],
        });

        const content = message.content[0];
        if (content.type !== "text") {
          throw new Error("Unexpected response type from Claude");
        }

        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in Claude response");
        }

        const params = JSON.parse(jsonMatch[0]);
        return SearchParamsSchema.parse(params);
      } catch (error: any) {
        console.warn(
          "Claude API failed, using simple fallback:",
          error.message
        );
        return this.extractParametersSimple(query);
      }
    }

    // Fallback to simple keyword-based extraction
    console.log("Using simple parameter extraction (no LLM available)");
    return this.extractParametersSimple(query);
  }

  // Simple template-based explanation (no API required)
  private generateExplanationSimple(
    query: string,
    results: any[]
  ): Record<string, string> {
    const explanations: Record<string, string> = {};

    for (const result of results.slice(0, 3)) {
      const company = result.companyDetails;
      const classification = result.classification;

      const reasons: string[] = [];

      // Match on profile type
      if (classification.profileType) {
        reasons.push(`${classification.profileType.toLowerCase()}`);
      }

      // Match on country
      if (company.country) {
        reasons.push(`located in ${company.country}`);
      }

      // Match on keywords
      if (classification.keywords && classification.keywords.length > 0) {
        reasons.push(
          `specializes in ${classification.keywords.slice(0, 2).join(" and ")}`
        );
      }

      explanations[result.profileId] = `This company is a ${reasons.join(
        ", "
      )}.`;
    }

    return explanations;
  }

  

  async generateExplanation(
    query: string,
    results: any[],
    limit: number = 3
  ): Promise<Record<string, string>> {
    if (results.length === 0) {
      return {};
    }

    const provider = process.env.LLM_PROVIDER || "ollama";

    // Try Claude API
    if (
      provider === "claude" &&
      process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-")
    ) {
      try {
        console.log("Using Claude API for explanation generation");
        const topResults = results.slice(0, limit);
        const explanationPrompt = `Given this search query: "${query}"

And these matching company profiles:
${topResults
  .map(
    (r, i) =>
      `${i + 1}. ${r.companyDetails.companyName} (${
        r.companyDetails.country
      }) - ${r.classification.profileType}`
  )
  .join("\n")}

Provide a brief 1-2 sentence explanation for each company explaining why it's a good match. Return as JSON object with profileId as key and explanation as value.`;

        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: explanationPrompt,
            },
          ],
        });

        const content = message.content[0];
        if (content.type !== "text") {
          throw new Error("Unexpected response type from Claude");
        }

        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in Claude response");
        }

        return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.warn(
          "Claude explanation failed, using simple fallback:",
          error.message
        );
        return this.generateExplanationSimple(query, results);
      }
    }

    // Fallback to simple template-based explanations
    console.log("Using simple explanation generation (no LLM available)");
    return this.generateExplanationSimple(query, results);
  }
}

export default new ClaudeService();
