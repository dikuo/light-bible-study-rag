'use client'

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'

type Result = {
  answer: string
  passages: string[]
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const [submittedQeustion, setSubmittedQuestion] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitHandler = async () => {
    try {
      if (!question.trim() || loading) return
      setError(null)
      setResult(null)
      setLoading(true)
      setSubmittedQuestion(question)

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setQuestion('')
      setResult({ answer: data.answer, passages: data.passages })

    } catch (error) {
      console.error(error)
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [result])

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#FAF7F2]">
      <header className="w-full bg-[#FDF6EC] border-b border-[#E8D8B0] px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-7 h-7 rounded-full bg-[#EF9F27] flex items-center justify-center text-sm font-medium text-[#412402]">
          ✦
        </div>
        <span className="text-sm font-medium text-[#412402]">
          Light — Bible Study
        </span>
      </header>

      <div className="w-full max-w-2xl px-4 pt-8 pb-40 flex-1">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center pt-20 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EF9F27] flex items-center justify-center text-sm font-medium text-[#412402] logo-spin cursor-pointer transition-all duration-300">
              ✦
            </div>
            <h1 className="text-xl font-medium text-gray-900 mt-4">
              Ask the Bible a question
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
              Grounded answers from scripture — every response cited to the verse.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                "What does the Bible say about work?",
                "How should I treat my colleagues?",
                "What is faith?",
                "What does the Bible say about love?"
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuestion(suggestion)
                    textareaRef.current?.focus()
                  }}  
                  className="rounded-full border border-gray-200 text-sm text-gray-500 bg-white px-4 py-1.5 cursor-pointer hover:bg-gray-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {(loading || result || error) && submittedQeustion && (
          <div className="flex justify-end mb-6">
            <div className="bg-[#EF9F27] text-[#412402] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[80%] leading-relaxed">
              {submittedQeustion}
            </div>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse"/>
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse" style={{animationDelay: '0.2s'}}/>
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse" style={{animationDelay: '0.4s'}}/>
            </div>
            <span className="text-sm text-gray-400">
              Searching scripture...
            </span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}
        {result && (
          <div ref={answerRef}>
            {/* answer card */}
            <div className="bg-white border rounded-lg px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none prose-p:text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-headings:text-base prose-headings:font-medium prose-p:my-1 prose-headings:my-2 prose-hr:my-2">
              <ReactMarkdown>
                {result?.answer}
              </ReactMarkdown>
            </div>
            {result!.passages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Sources
                </p>
                <div className="flex flex-col gap-2">
                  {result?.passages.map((p, i) => (
                    <div key={i} className="border-l-2 border-l-[#EF9F27] bg-[#F5F0E8] text-sm leading-relaxed px-3 py-2 text-gray-600">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#FDF6EC] border-t border-[#E8D8B0] p-4 flex justify-center">
        <div className="w-full max-w-2xl flex items-end gap-3 bg-[#FAF7F2] border border-[#E8D8B0] rounded-xl px-3 py-2">
          <textarea 
            value={question} 
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitHandler()
              }
            }}
            ref={textareaRef}
            placeholder="Write a question..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 placeholder-[#B0956A]"
          />
          <button 
            onClick={submitHandler}
            disabled={!question.trim() || loading}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              !question.trim() || loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#EF9F27] text-[#412402] cursor-pointer'
            }`}
          >
            ↑
          </button>
        </div>
      </div>
    </main>
  )
}