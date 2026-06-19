import os
import sys
from dotenv import load_dotenv
from anthropic import Anthropic
from openai import OpenAI
from pinecone import Pinecone

load_dotenv()
claude_client = Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index(os.environ['PINECONE_INDEX_NAME'])

question = input()

response = openai_client.embeddings.create(
    model='text-embedding-3-small',
    input=question,
    dimensions=512
)
question_embedding = response.data[0].embedding
results = index.query(
    vector=question_embedding,
    top_k=5,
    include_metadata=True
)

if (results.matches[0].score < 0.75):
    print("I couldn't find any Bible passages closely related to that question. Could you try rephrasing, or ask something about scripture or faith?")
    sys.exit()

texts = []
for r in results.matches:
    verse = r.metadata
    book_info = f"[{verse['book']} {verse['chapter']}:{verse['verse']}]"
    texts.append(f"{book_info} {verse['text']}")

context = ""
for i, t in enumerate(texts):
    context += f"{i + 1}. {t}\n"

prompt = f"""
    You are a helpful Bible study assistant.
    Context (retrieved passages): 
    {context}

    Question:
    {question}

    Instructions:
    - Answer using ONLY the passages provided above
    - Cite specific verse references in your answer
    - If the passages don't fully answer the question, say so honestly
"""

message = claude_client.messages.create(
    model='claude-sonnet-4-6',
    max_tokens=1024,
    messages=[{
        'role': 'user',
        'content': prompt
    }]
)

print(message.content[0].text)