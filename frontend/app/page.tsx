'use client'

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm"

type Message = {
  role: 'user' | 'assistant',
  content: string,
  passages?: string[]
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'zh'>('en')

  const submitHandler = async () => {
    try {
      if (!question.trim() || loading) return
      setError(null)
      setLoading(true)
      setMessages(prev => [...prev, { role: 'user', content: question }])

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          messages: messages.slice(-6)
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setQuestion('')
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, passages: data.passages }])

    } catch (error) {
      console.error(error)
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#FAF7F2]">
      <header className="w-full bg-[#FDF6EC] border-b border-[#E8D8B0] px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-7 h-7 rounded-full bg-[#EF9F27] flex items-center justify-center text-sm font-medium text-[#412402]">
          ✦
        </div>
        <span className="text-sm font-medium text-[#412402]">
          Light — {language === 'en' ? 'Bible Study' : '圣经学习'}
        </span>
        <button
          onClick={() => language === 'en' ? setLanguage('zh') : setLanguage('en')}
          className="ml-auto text-xs text-[#412402] border border-[#E8D8B0] rounded-full px-3 py-1 hover:bg-[#EF9F27] hover:text-white transition-colors"
        >
          {language === 'en' ? '中文' : 'EN'}
        </button>
      </header>

      <div className="w-full max-w-2xl px-4 pt-8 pb-40 flex-1">
        {messages.length <= 0 && !loading && !error && (
          <div className="flex flex-col items-center pt-20 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EF9F27] flex items-center justify-center text-sm font-medium text-[#412402] logo-spin cursor-pointer transition-all duration-300">
              ✦
            </div>
            <h1 className="text-xl font-medium text-gray-900 mt-4">
              {language === 'en'
                ? 'Ask the Bible a question'
                : '圣经问答'
              }
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
              {language === 'en'
                ? 'Grounded answers from scripture — every response cited to the verse.'
                : '以经文为根基 — 每个回答都有章节引用。'
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {(language === 'en'
                ? [
                  "What does the Bible say about work?",
                  "How should I treat my colleagues?",
                  "What is faith?",
                  "What does the Bible say about love?"
                ]
                : [
                  "圣经怎么说关于爱？",
                  "信心是什么意思？",
                  "如何面对困难？",
                  "神对我有什么计划？"
                ]
              ).map(suggestion => (
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
        {messages.length > 0 && (
          <div className="flex flex-col gap-6">
            {messages.map((message, i) => {
              const isLatestUserMessage = message.role === 'user' && i === messages.length - 1

              return message.role === 'user' ? (
                <div 
                  key={i} 
                  ref={isLatestUserMessage ? bottomRef : null}
                  className="flex justify-end"
                >
                  <div className="bg-[#EF9F27] text-[#412402] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[80%] leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={i}>
                  <div className="bg-white border rounded-lg px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none prose-p:text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-headings:text-base prose-headings:font-medium prose-p:my-1 prose-headings:my-2 prose-hr:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.passages && message.passages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                        {language === 'en' ? 'Sources' : '经文来源'}
                      </p>
                      <div className="flex flex-col gap-2">
                        {message.passages.map((p, j) => (
                          <div key={j} className="border-l-2 border-l-[#EF9F27] bg-[#F5F0E8] text-sm leading-relaxed px-3 py-2 text-gray-600">
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            )}
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-[#EF9F27] animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-sm text-gray-400">
              {language === 'en'
                ? 'Searching scripture...'
                : '搜索经文中...'
              }
            </span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
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
            placeholder={language === 'en' ? "Write a question..." : '在这里提问...'}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 placeholder-[#B0956A]"
          />
          <button
            onClick={submitHandler}
            disabled={!question.trim() || loading}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${!question.trim() || loading
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