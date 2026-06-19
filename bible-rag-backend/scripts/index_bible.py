from openai import OpenAI
from anthropic import Anthropic
from pinecone import Pinecone
from dotenv import load_dotenv
import os
import json

load_dotenv()
openAI = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
anthropic = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index(os.environ['PINECONE_INDEX_NAME'])

with open('data/web_bible.json', 'r', encoding='utf-8') as f:
    verses = json.load(f)
    BATCH_SIZE = 100
    for i in range(0, len(verses), BATCH_SIZE):
        batch = verses[i:i + BATCH_SIZE]
        texts = [verse['text'] for verse in batch]
        response = openAI.embeddings.create(
            model='text-embedding-3-small',
            input=texts,
            dimensions=512
        )

        vectors = []
        for verse, embedding_item in zip(batch, response.data):
            vector_id = f"{verse['book_id']}-{verse['chapter']}-{verse['verse']}"
            vectors.append({
                "id": vector_id,
                "values": embedding_item.embedding,
                "metadata": {
                    "text": verse['text'],
                    "book": verse['book_name'],
                    "chapter": verse['chapter'],
                    "verse": verse['verse']
                }
            })

        index.upsert(vectors=vectors)

    print("Done Indexing")
    print(f"Pinecone index stats: {index.describe_index_stats()}")