# Light — Bible Study (RAG-Powered Q&A)

An AI-powered Bible study app built on Retrieval-Augmented Generation (RAG). Ask any question, and the app retrieves the most relevant passages from the entire World English Bible (31,000+ verses, fully embedded and indexed), then generates a grounded, cited answer using only those retrieved passages — never the model's own assumptions.

🔗 **Live Demo:** https://yourwordsarelight.vercel.app
🔗 **GitHub:** https://github.com/dikuo/light-bible-study-rag

## Features

- **Semantic search** across 31,098 Bible verses (World English Bible) using OpenAI embeddings + Pinecone vector search
- **Grounded, cited answers** — every claim is backed by a specific verse reference, never freeform generation
- **Relevance-threshold fallback** — if no retrieved passage is a confident match (similarity score below threshold), the app honestly says so instead of guessing
- **Rate limiting** on the API route to prevent abuse
- **Clean, warm UI** — chat-style interface with markdown-rendered answers and a dedicated sources panel showing exact verse citations

## Tech Stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, react-markdown<br>
**Backend:** Next.js API Routes<br>
**AI/ML:** OpenAI Embeddings (text-embedding-3-small), Anthropic Claude (generation), Pinecone (vector database)<br>
**Deployment:** Vercel

## How It Works

1. **Indexing (one-time setup):** The full World English Bible is parsed from USFX XML into structured JSON (book, chapter, verse, text), embedded using OpenAI's `text-embedding-3-small` model, and upserted into a Pinecone index.
2. **Query:** A user's question is embedded the same way, then used to retrieve the top 5 most semantically similar verses from Pinecone.
3. **Relevance check:** If the best match's similarity score falls below a set threshold, the app returns a graceful "out of scope" response rather than forcing an answer.
4. **Generation:** The retrieved passages are passed to Claude with a strict instruction to answer using only those passages, citing each claim to its source verse.

## Setup

This is a monorepo with two parts: `backend/` (Python — one-time Bible indexing pipeline) and `frontend/` (Next.js — the app itself).

### Prerequisites

- Node.js 18+
- Python 3.9+
- API keys for OpenAI, Anthropic, and Pinecone

### 1. Index the Bible (required before first run)

The Pinecone index is not pre-populated — you need to embed and upsert all verses yourself.

```bash
cd backend
pip install -r requirements.txt --break-system-packages
```

Create a `.env` file inside `backend/` with:

```
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

Then run the indexing script:

```bash
python scripts/index_bible.py
```

This parses the Bible source data, generates embeddings, and upserts all 31,098 verses into your Pinecone index. This only needs to be run once (or whenever the source data changes).

### 2. Run the frontend

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` with:

```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Project Structure

```
bible-rag/
├── backend/
│   ├── api/
│   ├── data/                  # Bible source data (USFX XML → parsed JSON)
│   ├── scripts/
│   │   └── index_bible.py     # One-time Bible indexing script
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── api/
    │   │   └── query/
    │   │       └── route.ts   # RAG query endpoint (embed → retrieve → generate)
    │   ├── icon.png
    │   ├── layout.tsx
    │   └── page.tsx            # Chat UI
    ├── public/
    └── .env
```