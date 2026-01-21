# Matching Engine - Handover Documentation

## Overview

The Matching Engine is a sophisticated B2B company matching platform that combines vector search, AI-powered parameter extraction, and multi-criteria matching algorithms. It helps users find compatible business partners using semantic search and structured criteria matching.

**Tech Stack:**
- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Fastify (Node.js), TypeScript
- **Database:** OpenSearch (vector search + document storage)
- **AI Services:** Claude (Anthropic), Gemini (Google)
- **Integration:** Notion API
- **Deployment:** Docker, Docker Compose

---

## Architecture

### High-Level System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Port: 3002    │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│    Backend      │
│   (Fastify)     │
│   Port: 3001    │
└────────┬────────┘
         │
    ┌────┴─────┬────────────┬─────────────┐
    ▼          ▼            ▼             ▼
┌────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐
│OpenSearch││ Notion  │ │ Claude  │ │  Gemini    │
│ :9200   │ │   API   │ │   API   │ │    API     │
└────────┘ └─────────┘ └─────────┘ └────────────┘
```

### Data Flow

1. **User Input:** User defines ideal profile or selects from Notion parameters
2. **Parameter Extraction:** Claude API converts natural language to structured parameters
3. **Vector Search:** Gemini generates embeddings, OpenSearch performs KNN search
4. **Matching:** Backend applies weighted scoring algorithms
5. **Results Display:** Frontend shows ranked matches with breakdown
6. **Export:** Selected companies exported to Notion

---

## Backend Structure

### Entry Point
**`backend/src/index.ts`** - Main Fastify server configuration

```typescript
Port: 3001
CORS: Enabled (permissive for development)
Routes: All prefixed with /api
```

### API Routes

#### 1. Search Route (`routes/search.route.ts`)
```typescript
POST   /api/search              - Pure vector search with Gemini embeddings
GET    /api/profiles/:id        - Get single company profile
GET    /api/entities            - List all entities (paginated)
GET    /api/search/health       - Health check endpoint
```

#### 2. Match Route (`routes/match.route.ts`)
```typescript
POST   /api/search-matches      - Main matching endpoint (weights + parameters)
POST   /api/match               - Calculate match between two entities
POST   /api/match/batch         - Batch match calculations
POST   /api/extract-parameters  - AI parameter extraction (Claude)
```

#### 3. ICP Route (`routes/icp.route.ts`) - NEW
```typescript
POST   /api/icp/match           - Match against ICP template
POST   /api/icp/quick-match     - Quick match with inline criteria
GET    /api/icp/scoring-types   - Available scoring types
GET    /api/icp/fields          - Available ICP fields
POST   /api/icp/test-scoring    - Test scoring between values
```

#### 4. Notion Route (`routes/notion.route.ts`)
```typescript
GET    /api/notion/databases          - List accessible databases
GET    /api/notion/database/:id       - Get database content
GET    /api/notion/database/:id/schema - Get database schema
POST   /api/notion/databases/batch    - Batch retrieval
POST   /api/notion/export             - Export matches to Notion
```

### Core Services

#### Search Service (`services/search.service.ts`)
- **Purpose:** Vector search using OpenSearch KNN
- **Embedding:** Uses Gemini embedding API
- **Index:** `dutch-companies-vector-index`

```typescript
async searchWithEmbedding(query: string, size?: number): Promise<SearchResult[]>
```

#### Matching Service (`services/matching.service.ts`)
- **Purpose:** Multi-criteria matching with weighted scoring
- **Features:**
  - Geographic scoring (distance-based km)
  - Categorical scoring (similarity matrices)
  - Semantic scoring (Levenshtein distance)
  - Numeric scoring (ratio-based)
  - Exact scoring (binary match)

```typescript
async findMatchesWithWeights(request: MatchRequest): Promise<MatchResponse>
async matchWithICPTemplate(request: ICPMatchRequest): Promise<ICPMatchResponse>
```

#### Geographic Service (`services/geographic.service.ts`) - NEW
- **Purpose:** Country-to-country distance scoring
- **Algorithm:** Haversine formula with city coordinates
- **Max Distance:** 5000km (0% score)
- **60+ countries** with lat/lng coordinates

```typescript
calculateProximityScore(country1: string, country2: string): {
  score: number;        // 0-100
  distanceKm: number;
  explanation: string;
}
```

#### Categorical Service (`services/categorical.service.ts`) - NEW
- **Purpose:** Category similarity scoring
- **Matrices:**
  - Profile type pairs (Distributor-Wholesaler = 85%)
  - Market segment similarities

```typescript
getProfileTypeSimilarity(type1: string, type2: string): SimilarityScore
getMarketSegmentSimilarity(seg1: string, seg2: string): SimilarityScore
```

#### Notion Service (`services/notion.service.ts`)
- **Purpose:** Notion API integration
- **Features:**
  - Database listing and content retrieval
  - Schema introspection
  - Batch operations (350ms rate limiting)
  - Company export

#### Gemini Embedding Service (`services/gemini-embedding.service.ts`)
- **Purpose:** Text embedding generation
- **Model:** `text-embedding-004`
- **Usage:** Vector search queries

#### Claude Service (`services/claude.service.ts`)
- **Purpose:** Natural language parameter extraction
- **Model:** Claude 3.5 Sonnet
- **Usage:** Convert text queries to structured parameters

### Data Models

#### Company Entity
```typescript
interface CompanyEntity {
  profileId: string;
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
  semanticEmbedding: number[];  // Vector for similarity search
}
```

#### ICP Template Types
```typescript
type ScoringType = 'geographic' | 'categorical' | 'semantic' | 'numeric' | 'exact';

interface ICPCriterion {
  id: string;
  field: string;           // e.g., 'country', 'profileType'
  label: string;           // e.g., 'Country', 'Profile Type'
  value: any;              // The criteria value
  weight: number;          // 1-10 importance
  scoringType: ScoringType;
  config?: {               // Optional scoring config
    maxDistance?: number;
    tolerance?: number;
  };
}

interface ICPTemplate {
  id: string;
  name: string;
  criteria: ICPCriterion[];
}
```

---

## Frontend Structure

### Main Application
**`frontend/src/app/page.tsx`** - Main match page with two modes:

1. **Legacy Match Mode:** Select company + define ideal profile + allocate weights
2. **ICP Quick Match Mode:** Define inline criteria with weights directly

### Key Components

#### ICPQuickMatch (`components/ICPQuickMatch.tsx`)
- **Purpose:** Quick ICP matching interface
- **Features:**
  - Dynamic criterion addition
  - Weight sliders (1-10)
  - Threshold control (0-100%)
  - Available fields: Country, City, Profile Type, Market Segment, Keywords, Employees, Turnover

#### MatchResultsList (`components/MatchResultsList.tsx`)
- **Purpose:** Display match results with breakdown
- **Features:**
  - Threshold slider filtering
  - Expandable parameter breakdown
  - Data completeness indicator
  - Bulk selection for export
  - Support for both Legacy and ICP results

#### NotionExportDialog (`components/NotionExportDialog.tsx`)
- **Purpose:** Export selected companies to Notion
- **Features:**
  - Database selection
  - Field mapping
  - Batch export with progress tracking

#### IdealProfileBuilder (`components/IdealProfileBuilder.tsx`)
- **Purpose:** Define ideal company profile
- **Features:**
  - Text query input
  - Dynamic filter management

#### WeightAllocator (`components/WeightAllocator.tsx`)
- **Purpose:** Allocate weights to parameters
- **Features:**
  - Visual weight distribution
  - 100% total validation

#### NotionParameterSelector (`components/NotionParameterSelector.tsx`)
- **Purpose:** Select Notion databases for parameters
- **Features:**
  - Database listing
  - Parameter selection

### Type Definitions (`types.ts`)

```typescript
// Search Results
interface SearchResult {
  profileId: string;
  score: number;
  companyDetails: { ... };
  classification: { ... };
  primaryContact: { ... };
}

// ICP Results
interface ICPMatchResult {
  companyId: string;
  companyName: string;
  matchPercentage: number;
  parameterMatches: ICPParameterMatchResult[];
  dataCompleteness: number;
  totalCriteria: number;
  matchedCriteria: number;
}

// Requests
interface QuickMatchRequest {
  criteria: Record<string, any>;
  weights?: Record<string, number>;
  minThreshold?: number;
  maxResults?: number;
}
```

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development

# OpenSearch
OPENSEARCH_URL=http://opensearch-node1:9200
OPENSEARCH_INDEX=dutch-companies-vector-index

# AI Services
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
NOTION_API_KEY=your_key_here

# Logging
LOG_LEVEL=info
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Production: http://37.60.255.128:3001
```

### Docker Configuration

#### Networks
- `matching-engine-network`: Internal communication
- `opensearch-opensearch-net`: External OpenSearch connection

#### Services
```yaml
backend:
  build: ./backend
  ports: ["3001:3001"]
  networks:
    - matching-engine-network
    - opensearch-opensearch-net
  environment:
    - OPENSEARCH_URL=http://opensearch-node1:9200

frontend:
  build: ./frontend
  ports: ["3002:3000"]
  environment:
    - NEXT_PUBLIC_API_URL=http://37.60.255.128:3001
```

---

## Deployment

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev   # Hot reload on port 3001

# Frontend
cd frontend
npm install
npm run dev   # Turbopack on port 3002

# With Docker
docker-compose up -d
```

### Production Deployment

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Update running container
git pull
docker-compose up -d --build backend
```

### Server Details (Production)
- **Server IP:** 37.60.255.128
- **Frontend URL:** http://37.60.255.128:3002
- **Backend URL:** http://37.60.255.128:3001
- **OpenSearch:** Docker container on `opensearch-opensearch-net`

---

## OpenSearch Configuration

### Index: `dutch-companies-vector-index`

**Key Fields:**
- `semanticEmbedding` - Vector for KNN search (1024 dimensions)
- `companyDetails` - Nested company information
- `classification` - Profile type, segment, keywords

**KNN Search:**
```json
{
  "size": 50,
  "query": {
    "knn": {
      "semanticEmbedding": {
        "vector": [ ...embedding... ],
        "k": 50
      }
    }
  }
}
```

---

## Scoring Algorithms

### 1. Geographic Scoring
- **Algorithm:** Haversine formula (great-circle distance)
- **Input:** Two country names
- **Output:** 0-100 score based on distance
- **Max distance:** 5000km = 0%
- **Same country:** 100%

**Example:**
- Netherlands → Germany: 577km = 88%
- Netherlands → Spain: 1500km = 70%

### 2. Categorical Scoring
- **Profile Type:** Predefined similarity matrix
- **Market Segment:** Similarity scoring
- **Example:** Distributor ↔ Wholesaler = 85%

### 3. Semantic Scoring
- **Algorithm:** Levenshtein distance
- **Input:** Two text strings
- **Output:** Similarity percentage

### 4. Numeric Scoring
- **Algorithm:** Ratio-based with tolerance
- **Input:** Two numbers
- **Output:** 100% if within tolerance, else scaled

### 5. Exact Scoring
- **Algorithm:** Binary match
- **Input:** Any two values
- **Output:** 100% if equal, 0% if different

### Missing Data Handling
- **Strategy:** Skip and normalize
- Missing fields are **not penalized**
- Final score normalized by actual weights used

---

## Potential New Features

### High Priority
1. **ICP Template Management**
   - Save/load ICP templates from Notion
   - Template builder UI
   - Share templates between users

2. **User Authentication**
   - Login/logout
   - Saved searches
   - User-specific ICP templates

3. **Historical Match Tracking**
   - Save match results
   - Compare matches over time
   - Export history

### Medium Priority
4. **Real-time Notifications**
   - WebSocket updates
   - New company alerts
   - Match result notifications

5. **Advanced Analytics**
   - Match statistics dashboard
   - Popular criteria tracking
   - Success metrics

6. **Bulk Import/Export**
   - CSV import for companies
   - Bulk match processing
   - Scheduled reports

### Low Priority
7. **Multi-language Support**
   - I18n for UI
   - Multi-language search

8. **API Rate Limiting & Caching**
   - Redis caching layer
   - Rate limiting per user
   - Request queue management

9. **Advanced Filtering**
   - Boolean logic (AND/OR/NOT)
   - Range filters
   - Saved filter presets

10. **Collaborative Features**
    - Share search results
    - Comments on matches
    - Team workspaces

---

## Troubleshooting

### Common Issues

**1. "No companies found" error**
- Check OpenSearch connection: `curl http://localhost:9200/_cluster/health`
- Verify index exists: `curl http://localhost:9200/_cat/indices?v`
- Check backend environment variables

**2. Frontend can't connect to backend**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running on port 3001
- Check CORS settings in backend

**3. Neural search fails**
- Verify ML connector is deployed in OpenSearch
- Check model group status: `GET /_plugins/_ml/models/_all`
- Redeploy connector if needed

**4. Notion export fails**
- Verify NOTION_API_KEY is valid
- Check database has required columns
- Review rate limiting (350ms between batch operations)

---

## File Structure Reference

```
matching-engine/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Server entry point
│   │   ├── routes/
│   │   │   ├── search.route.ts         # Vector search endpoints
│   │   │   ├── match.route.ts          # Matching endpoints
│   │   │   ├── icp.route.ts            # ICP matching (NEW)
│   │   │   ├── notion.route.ts         # Notion integration
│   │   │   └── match-search.route.ts   # Legacy matching
│   │   ├── services/
│   │   │   ├── search.service.ts       # Vector search logic
│   │   │   ├── matching.service.ts     # Core matching algorithms
│   │   │   ├── geographic.service.ts   # Distance scoring (NEW)
│   │   │   ├── categorical.service.ts  # Category similarity (NEW)
│   │   │   ├── notion.service.ts       # Notion API
│   │   │   ├── gemini-embedding.service.ts
│   │   │   └── claude.service.ts       # AI parameter extraction
│   │   └── types/
│   │       └── icp-template.ts         # ICP type definitions
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout
│   │   │   └── page.tsx                # Main application
│   │   ├── components/
│   │   │   ├── ICPQuickMatch.tsx       # Quick match UI (NEW)
│   │   │   ├── MatchResultsList.tsx    # Results display
│   │   │   ├── NotionExportDialog.tsx  # Export to Notion
│   │   │   ├── IdealProfileBuilder.tsx
│   │   │   ├── WeightAllocator.tsx
│   │   │   ├── NotionParameterSelector.tsx
│   │   │   └── SingleEntitySelector.tsx
│   │   └── types.ts                    # TypeScript definitions
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local
│
├── docker-compose.yml
├── .gitignore
└── HANDOVER.md
```

---

## Contact & Resources

- **Frontend Docs:** https://nextjs.org/docs
- **Backend Docs:** https://fastify.dev
- **OpenSearch Docs:** https://opensearch.org/docs
- **Notion API:** https://developers.notion.com

---

**Last Updated:** January 2025
**Version:** 2.0 (with ICP Quick Match)
