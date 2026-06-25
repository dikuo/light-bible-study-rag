import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { Pinecone } from "@pinecone-database/pinecone"
import { NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

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

const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "30 m")
})

export async function POST(request: Request) {
    try {
        const { question, messages = [] } = await request.json()
        const isChinese = /[\u4e00-\u9fff]/.test(question)
        const language = isChinese ? 'zh' : 'en'

        const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
        const { success } = await rateLimit.limit(ip)

        if (!success) {
            return NextResponse.json(
                { error: isChinese 
                    ? '您已达到使用限制，请稍后再试。'
                    : 'You reached the limit of rate now. Please try it again later.' 
                },
                { status: 429 }
            )
        }

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required.' },
                { status: 400 }
            )
        }

        const cleanMessages = messages.map(({ role, content } : { role: string, content: string}) => ({ role, content }))
        // 1. rewrite the query if there is a conversation history
        let searchQuery = question
        if (messages.length > 0) {
            const rewriteResponse = await claude_client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 200,
                system: 'Rewrite the latest user question as a standalone search query that includes all necessary context from the conversation history. Return ONLY the rewritten query, nothing else.',
                messages: [
                    ...cleanMessages,
                    { role: 'user', content: question }
                ]
            })
            const rewriteBlock =  rewriteResponse.content[0]
            if (rewriteBlock.type === 'text') {
                searchQuery = rewriteBlock.text
            }
        }

        // 2. pinecone retrieval using rewritten query
        const embeddingResponse = await openai_client.embeddings.create({
            model: 'text-embedding-3-small',
            input: searchQuery,
            dimensions: 512
        })
        const question_embedding = embeddingResponse.data[0].embedding

        const results = await index.query({
            vector: question_embedding,
            topK: 5,
            includeMetadata: true,
            namespace: language === 'en' ? '' : 'chinese'
        })

        const texts = results.matches.map(r => {
            const verse = r.metadata!
            const book_info = `[${verse.book} ${verse.chapter}:${verse.verse}]`
            return `${book_info} ${verse.text}`
        })

        const context = texts.map((t, index) => `${index + 1}. ${t}`).join('\n')

        const chineseInstruction = language === 'zh'
            ? '\n- Answer in Simplified Chinese'
            : ''

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
            ${chineseInstruction}
            `

        const answerReponse = await claude_client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [
                ...cleanMessages, 
            {
                role: 'user',
                content: prompt
            }]
        })

        const block = answerReponse.content[0]
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