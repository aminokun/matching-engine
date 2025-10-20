# Company Profile Matching Engine

> AI-powered business partner matching using hybrid search (text + ML vectors)

Self-hosted on Docker. Natural language queries. Semantic search with locally-run ML models.

## Quick Start

```bash
# 1. Add your Claude API key
cp .env.example .env
# Edit .env: ANTHROPIC_API_KEY=sk-ant-...

# 2. Start everything (takes 2-3 minutes first time)
./start.sh

# 3. Access the app
open http://localhost:3002
```

That's it! The script handles Elasticsearch, ML model download, embedding generation, and data indexing.

## What You Get

**Search Interface**: Natural language queries
- "Find distributors in Germany for lighting equipment"
- "Enterprise companies in Netherlands with 100+ employees"
- "Manufacturers offering technical support for audio"

**AI-Powered**:
- Claude AI extracts search parameters from natural language
- Self-hosted ML model (Transformers.js) generates semantic embeddings
- Elasticsearch performs hybrid search (text + vectors)

**5 Sample Companies**:
- 🇬🇧 Starlight Solutions (UK, Wholesaler, Lighting/Audio)
- 🇩🇪 TechVision Distribution (Germany, Distributor, AV/Lighting)
- 🇳🇱 AudioPro Netherlands (Netherlands, Distributor, Audio)
- 🇫🇷 LumiTech France (France, Manufacturer, LED Lighting)
- 🇪🇸 SoundWave Iberia (Spain, Distributor, Audio/DJ)

## Architecture

```
User Query: "Find distributors in Germany for lighting"
    ↓
Frontend (Next.js) → Backend API (Node.js/Fastify)
    ↓
    ├─→ Claude AI: Extract {country, profileType, keywords}
    ├─→ Transformers.js: Generate semantic embedding
    └─→ Elasticsearch: Hybrid search (text + vectors)
    ↓
Ranked Results with Match Scores
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Search** | Elasticsearch 8.11 (with vector search) |
| **Backend** | Node.js 20 + Fastify + TypeScript |
| **Frontend** | Next.js 14 + React + Tailwind CSS |
| **AI (NLP)** | Claude 3.5 Sonnet API |
| **AI (ML)** | Transformers.js (self-hosted, 100% local) |
| **Vector Model** | all-MiniLM-L6-v2 (384D embeddings) |
| **Container** | Docker Compose |

### Services (3 Containers)

- **Elasticsearch** (port 9200) - Search engine + vector store
- **Backend API** (port 3001) - AI orchestration + search
- **Frontend** (port 3002) - User interface

## Machine Learning

### Self-Hosted (Runs on Your Server)
- **Transformers.js** with all-MiniLM-L6-v2 model
- Generates 384-dimensional semantic embeddings
- ~90MB model, downloaded once and cached
- No external API calls for ML inference

### Cloud API (Pay-per-use)
- **Claude 3.5 Sonnet** for natural language understanding
- Extracts structured search parameters from queries
- ~$0.01 per search

**Why hybrid?** Claude excels at NLP but costs money. Transformers.js is free and fast for embeddings but runs locally. Best of both worlds.

## Project Structure

```
matching-engine/
├── backend/              # Node.js API + AI services
│   ├── src/
│   │   ├── index.ts                    # Server entry
│   │   ├── routes/search.route.ts      # Search API
│   │   └── services/
│   │       ├── claude.service.ts       # Claude AI integration
│   │       ├── embedding.service.ts    # Transformers.js ML
│   │       └── search.service.ts       # Elasticsearch queries
│   ├── scripts/generate-embeddings.ts  # Precompute embeddings
│   └── Dockerfile
├── frontend/             # Next.js UI
│   ├── app/
│   │   ├── page.tsx                    # Main search page
│   │   └── components/
│   │       ├── SearchBox.tsx           # Search input
│   │       └── ResultsList.tsx         # Results display
│   └── Dockerfile
├── elasticsearch/
│   ├── mappings.json     # Index schema (includes dense_vector)
│   └── sample-data.json  # 5 sample companies
├── docker-compose.yml    # All services
├── start.sh              # One-command startup
└── .env.example          # Environment template
```

## Documentation

- **MVP_SKELETON.md** - Bare minimum components explained
- **ARCHITECTURE.md** - Technical deep-dive and ML details

## Development

### Backend
```bash
cd backend
npm install
npm run dev  # Hot reload with tsx
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### Adding Companies

1. Edit `elasticsearch/sample-data.json`
2. Run embedding generation:
   ```bash
   cd backend
   tsx scripts/generate-embeddings.ts
   ```

## API Endpoints

### `POST /api/search`
Search for companies using natural language or structured filters.

**Request:**
```json
{
  "query": "Find distributors in Germany",
  "includeExplanations": false
}
```

**Response:**
```json
{
  "results": [
    {
      "profileId": "PROF-DE-45201",
      "companyDetails": {
        "companyName": "TechVision Distribution GmbH",
        "country": "Germany",
        "employees": 250
      },
      "score": 8.7
    }
  ],
  "totalHits": 3,
  "took": 245,
  "extractedParams": {
    "country": "Germany",
    "profileType": "Distributor"
  }
}
```

### `GET /api/profiles/:id`
Get a single company profile by ID.

### `GET /api/search/health`
Check health of Elasticsearch and ML model.

## Deployment (School Servers)

**Requirements**:
- Docker + Docker Compose
- 4GB RAM minimum (8GB recommended)
- 10GB disk space
- ANTHROPIC_API_KEY

**Steps**:
```bash
git clone <repo>
cd matching-engine
cp .env.example .env
# Add ANTHROPIC_API_KEY=sk-ant-... to .env
./start.sh
```

**Access**:
- Frontend: `http://your-server:3002`
- Backend API: `http://your-server:3001`

**Optional**: Setup nginx reverse proxy for production.

## Troubleshooting

**Elasticsearch won't start**
```bash
docker-compose logs elasticsearch
# May need to increase Docker memory to 4GB+
```

**Backend can't connect to Elasticsearch**
```bash
# Wait for health check (30-60s)
docker-compose ps
```

**Slow first search**
- ML model downloads ~90MB on first run
- Subsequent searches are fast (200-500ms)

**No results**
```bash
# Verify data indexed
curl -u elastic:changeme http://localhost:9200/company-profiles/_count
# Should return: {"count": 5}
```

## Performance

- **Startup time**: 30-60 seconds (after first run)
- **Query time**: 200-500ms average
- **Embedding generation**: 50-100ms per text
- **Scalability**: Millions of profiles supported

## Future Enhancements

- [ ] Learning to Rank (LTR) based on user feedback
- [ ] Redis caching for common queries
- [ ] More data sources (LinkedIn, company databases)
- [ ] Advanced filter UI (sliders, checkboxes)
- [ ] Claude-powered match explanations
- [ ] User authentication and saved searches
- [ ] Prometheus + Grafana monitoring

## License

Educational project for group semester work.

## Contributors

[Your Team Members]

---

**Key Innovation**: Self-hosted ML (Transformers.js) for embeddings + Claude API only for NLP. Keeps costs low and data on your servers.
