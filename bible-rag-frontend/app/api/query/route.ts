import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { Pinecone } from "@pinecone-database/pinecone"
import { NextResponse } from "next/server"

const openai_client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
})
const claude_client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!
})
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
})
const index = pc.index(process.env.PINECONE_INDEX_NAME!)

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const question = data.question

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required.' },
                { status: 400 }
            )
        }

        const response = await openai_client.embeddings.create({
            model: 'text-embedding-3-small',
            input: question,
            dimensions: 512
        })
        const question_embedding = response.data[0].embedding

        const results = await index.query({
            vector: question_embedding,
            topK: 5,
            includeMetadata: true
        })

        const texts = results.matches.map(r => {
            const verse = r.metadata!
            const book_info = `[${verse.book} ${verse.chapter}:${verse.verse}]`
            return `${book_info} ${verse.text}`
        })

        const context = texts.map((t, index) => `${index + 1}. ${t}`).join('\n')

        const prompt = `
            You are a helpful Bible study assistant.
            Context (retrieved passages): 
            ${context}

            Question:
            ${question}

            Instructions:
            - Answer using ONLY the passages provided above
            - Cite specific verse references in your answer
            - If the passages don't fully answer the question, say so honestly
        `

        const message = await claude_client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: prompt
            }]
        })

        const block = message.content[0]
        let answer = ''
        if (block.type === 'text') {
            answer = block.text
        }

        return NextResponse.json({
            answer,
            passages: texts
        })

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        )
    }
}