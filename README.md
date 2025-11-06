# Company Matching Engine - MVP

A dynamic matching engine that calculates similarity between companies based on user-configurable parameters and weighted importance. Built with Next.js 15 frontend, Fastify backend, and Elasticsearch for entity storage.

## 🎯 Overview

This MVP delivers the core matching functionality required by the Pairwise platform, allowing non-technical users to:

1. **Configure Parameter Weights** - Select which company characteristics matter and assign importance weights (must sum to 100%)
2. **Select Companies** - Choose two companies from the database to compare
3. **Get Match Percentage** - Receive a weighted match score with detailed parameter-level breakdown
4. **Understand Matches** - View transparent explanations of how each parameter was matched and its contribution to the total

## ✨ Key Features

### Weight Allocation Interface
- **Checkbox Selection**: Enable/disable which parameters to use for matching
- **Weight Sliders**: Adjust importance of each parameter (0-100%)
- **Real-time Validation**: Immediate feedback on weight totals
- **Auto-balance**: Distribute weights equally across selected parameters

### Company Selection
- **Database Lookup**: Browse all indexed companies
- **Live Preview**: See company details before matching (country, size, segment, turnover, employees)
- **Dropdown Selection**: Easy selection of two different companies

### Match Results Display
- **Large Circular Gauge**: Visual representation of total match percentage (0-100%)
- **Color-coded**: Green (75%+), Yellow (50-75%), Red (<50%)
- **Parameter Breakdown**: Expandable details for each parameter showing:
  - Match percentage
  - Values compared
  - Calculation explanation
  - Weight contribution to total
- **Detailed Comparison**: Side-by-side value display

## 🏗️ Architecture

### Backend Stack
- **Framework**: Fastify (TypeScript)
- **Database**: Elasticsearch 8.11
- **Node.js**: v18+
- **Port**: 3001

### Frontend Stack
- **Framework**: Next.js 15 with React 19
- **UI Library**: Tailwind CSS + Radix UI components
- **Port**: 3000

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Services**: Elasticsearch, Backend API, Frontend

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Quick Start

```bash
# 1. Start Elasticsearch (first terminal)
./dev.sh

# 2. Initialize Elasticsearch index (another terminal, from project root)
node scripts/init-elasticsearch.js

# 3. Start Backend API (another terminal)
cd backend && npm install && npm run dev

# 4. Start Frontend (another terminal)
cd frontend && npm install && npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000/match
- Backend API: http://localhost:3001
- Elasticsearch: http://localhost:9200 (elastic/changeme)

## 📊 API Endpoints

### GET /api/parameters
List all available parameters for matching

```json
Response:
{
  "count": 9,
  "parameters": [
    {
      "name": "country",
      "label": "Country",
      "type": "exact"
    },
    ...
  ]
}
```

### GET /api/entities
List available companies in the database

```json
Response:
{
  "total": 5,
  "count": 5,
  "entities": [
    {
      "profileId": "PROF-UK-83619",
      "companyName": "Starlight Solutions Ltd.",
      "country": "United Kingdom",
      "city": "Manchester",
      "profileType": "Wholesaler",
      "marketSegment": "mid-market",
      "numberOfEmployees": 125,
      "annualTurnover": 25500000
    },
    ...
  ]
}
```

### GET /api/entity/:profileId
Get detailed information about a specific company

### POST /api/match
Calculate match between two entities with custom weights

```json
Request:
{
  "entity1Id": "PROF-UK-83619",
  "entity2Id": "PROF-DE-45201",
  "weights": [
    { "parameterName": "country", "weight": 25 },
    { "parameterName": "marketSegment", "weight": 25 },
    { "parameterName": "numberOfEmployees", "weight": 25 },
    { "parameterName": "keywords", "weight": 25 }
  ]
}

Response:
{
  "entity1Id": "PROF-UK-83619",
  "entity1Name": "Starlight Solutions Ltd.",
  "entity2Id": "PROF-DE-45201",
  "entity2Name": "TechVision Distribution GmbH",
  "totalMatchPercentage": 12.5,
  "parameterMatches": [
    {
      "parameterName": "country",
      "parameterLabel": "Country",
      "type": "exact",
      "matchPercentage": 0,
      "value1": "United Kingdom",
      "value2": "Germany",
      "explanation": "No match: \"United Kingdom\" ≠ \"Germany\""
    },
    ...
  ],
  "weights": [...],
  "timestamp": "2025-10-23T11:43:06.805Z"
}
```

## 📐 Matching Algorithm

The matching algorithm calculates percentages based on parameter type:

### Exact Match (country, city, profileType, marketSegment)
- **100%** if values match exactly
- **0%** if values differ

Example: "Distributor" vs "Wholesaler" = 0%

### Numeric (numberOfEmployees, annualTurnover)
- Based on overlap ratio
- Formula: `min(value1, value2) / max(value1, value2) * 100`

Example: 125 employees vs 250 employees = (125/250) * 100 = 50%

### Text (companyName, summaryOfActivity)
- Levenshtein distance-based similarity
- Formula: `100 - (distance / maxLength) * 100`

Example: "AudioPro" vs "AudioPro Solutions" = ~89%

### Array (keywords, servicesOffered, clientTypesServed)
- Intersection-based matching
- Formula: `(matching_items / max_array_length) * 100`

Example: ["AV distribution", "pro lighting"] vs ["AV equipment", "event technology"] = 0%

### Weighted Total
```
totalMatch = Σ(parameterMatch × parameterWeight) / 100
```

## 🎓 How the Matching Works - Example

**Scenario**: Matching "Starlight Solutions" (UK, mid-market, 125 employees) vs "TechVision Distribution" (Germany, enterprise, 250 employees)

**Weights Configured**:
- Country: 25%
- Market Segment: 25%
- Employees: 25%
- Keywords: 25%

**Results**:
- Country: UK ≠ Germany = 0% × 25% = 0%
- Market Segment: mid-market ≠ enterprise = 0% × 25% = 0%
- Employees: 125 vs 250 = 50% × 25% = 12.5%
- Keywords: No common keywords = 0% × 25% = 0%

**Total Match: 12.5%**

## 🗄️ Elasticsearch Schema

### Index: company-profiles

**Document Structure**:
```json
{
  "profileId": "PROF-UK-83619",
  "ingestionDate": "2025-09-29T10:15:00Z",
  "source": "WebScraper_V2.1",
  "companyDetails": {
    "companyName": "Starlight Solutions Ltd.",
    "country": "United Kingdom",
    "city": "Manchester",
    "summaryOfActivity": "...",
    "dateEstablished": "2010-05-12",
    "numberOfEmployees": 125,
    "annualTurnover": 25500000,
    "website": "https://...",
    "linkedinPage": "https://...",
    "telephone": "+44 161 456 7890",
    "generalEmail": "sales@..."
  },
  "classification": {
    "profileType": "Wholesaler",
    "marketSegment": "mid-market",
    "keywords": ["AV distribution", "pro lighting wholesale", ...],
    "servicesOffered": ["Product Distribution", "Technical Support", ...],
    "clientTypesServed": ["Rental Companies", "Installers", ...]
  },
  "primaryContact": {
    "firstName": "Arthur",
    "lastName": "Pendleton",
    "jobTitle": "Head of Procurement",
    "gender": "Male",
    "email": "a.pendleton@...",
    "telephone": "+44 161 456 7891",
    "linkedinPage": "https://...",
    "type": "decision maker"
  }
}
```

## 🔄 Available Parameters for Matching

| Parameter | Type | Description |
|-----------|------|-------------|
| country | exact | Geographic location |
| marketSegment | exact | Market segment (small-business, mid-market, enterprise) |
| city | exact | City location |
| profileType | exact | Company type (Distributor, Manufacturer, etc.) |
| numberOfEmployees | numeric | Headcount |
| annualTurnover | numeric | Revenue in USD |
| keywords | text | Industry focus keywords |
| servicesOffered | text | Services provided |
| companyName | text | Company name similarity |

## 📁 Project Structure

```
matching-engine/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Main entry point
│   │   ├── routes/
│   │   │   ├── search.route.ts        # Search endpoints
│   │   │   └── match.route.ts         # Matching endpoints
│   │   └── services/
│   │       ├── elasticsearch.service.ts
│   │       ├── matching.service.ts
│   │       ├── search.service.ts
│   │       └── claude.service.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Search page
│   │   │   └── match/
│   │   │       └── page.tsx           # Matching page
│   │   └── components/
│   │       ├── WeightAllocator.tsx    # Weight configuration
│   │       ├── EntitySelector.tsx     # Company selection
│   │       ├── MatchResults.tsx       # Results display
│   │       └── ...other components
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.local
│
├── elasticsearch/
│   ├── mappings.json                  # Index mappings
│   ├── sample-data.json               # Test data
│   └── sample-data.ndjson             # Bulk load format
│
├── scripts/
│   ├── init-elasticsearch.js          # Index initialization
│   └── ...
│
├── docker-compose.yml                 # Service orchestration
├── dev.sh                             # Development startup
├── stop.sh                            # Stop services
└── README.md                          # This file
```

## 🧪 Testing the System

### 1. Test Weight Allocator
- Navigate to http://localhost:3000/match
- Select 3-4 parameters
- Use sliders to set weights
- Verify total is 100%

### 2. Test Entity Selection
- Select two different companies
- Review company details
- Verify both are different

### 3. Test Matching Calculation
- Configure weights (must sum to 100%)
- Select two companies
- Verify results appear automatically
- Check parameter breakdown

### 4. Test API Directly (curl)

```bash
# Get parameters
curl http://localhost:3001/api/parameters

# Get entities
curl http://localhost:3001/api/entities?limit=3

# Calculate match
curl -X POST http://localhost:3001/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "entity1Id": "PROF-UK-83619",
    "entity2Id": "PROF-DE-45201",
    "weights": [
      {"parameterName": "country", "weight": 50},
      {"parameterName": "numberOfEmployees", "weight": 50}
    ]
  }'
```

## 🚨 Troubleshooting

### Elasticsearch Connection Error
```
Error: getaddrinfo ENOTFOUND elasticsearch
```
**Solution**: Ensure Elasticsearch is running with `./dev.sh` and backend has correct ELASTICSEARCH_URL in `.env`

### Frontend can't reach Backend
```
Error: Failed to fetch entities
```
**Solution**: Verify backend is running on port 3001 and CORS is enabled

### Weights not summing to 100%
**Solution**: The slider will show an error. Use "Auto Balance" button to redistribute equally

### No entities in database
**Solution**: Run `node scripts/init-elasticsearch.js` to load sample data

## 📈 Sample Data

The system comes with 5 pre-loaded European companies:
1. **Starlight Solutions Ltd.** (UK) - AV/Lighting Wholesaler
2. **TechVision Distribution GmbH** (Germany) - AV Equipment Distributor
3. **AudioPro Netherlands B.V.** (Netherlands) - Professional Audio Specialist
4. **LumiTech France S.A.** (France) - LED Lighting Manufacturer
5. **SoundWave Iberia S.L.** (Spain) - Professional Audio Distributor

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- [ ] Semantic/Vector-based matching using embeddings
- [ ] Batch matching (multiple company pairs)
- [ ] Match history and saved configurations
- [ ] Custom parameter templates
- [ ] Export results to CSV/PDF
- [ ] Match recommendation engine

### Phase 3: Data & Integration
- [ ] PostgreSQL for persistent storage
- [ ] Notion API integration for data import
- [ ] Real-time data ingestion pipeline
- [ ] Web scraping for company data updates

### Phase 4: Scaling
- [ ] Support for 100K+ entities
- [ ] Distributed matching calculation
- [ ] Advanced caching strategies
- [ ] Performance optimization

### Phase 5: Enterprise
- [ ] User authentication and roles
- [ ] Multi-tenant support
- [ ] Azure deployment
- [ ] Audit logging
- [ ] Analytics dashboard

## 📝 Configuration

### Environment Variables

**Backend (.env)**:
```
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_INDEX=company-profiles
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
ANTHROPIC_API_KEY=your_key_here
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📞 Support & Questions

For questions or issues, refer to:
- API Documentation: See "API Endpoints" section above
- Matching Algorithm: See "Matching Algorithm" section above
- Architecture: See "Architecture" section above

## 📄 License

MIT

---

**Built for**: Hedgecreek Pairwise Project
**Status**: MVP Complete
**Last Updated**: October 23, 2025
