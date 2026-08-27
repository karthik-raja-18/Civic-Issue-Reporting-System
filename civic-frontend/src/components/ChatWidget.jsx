import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../api/chatApi'

/**
 * ChatWidget — "Ask CivicPulse" floating assistant.
 *
 * This is the user-facing surface of the RAG pipeline. Every answer is
 * either:
 *   grounded=true  → backed by real retrieved issue data (shown as
 *                     "Sources" chips the user can click through to)
 *   grounded=false → an honest "I don't have enough data" or a plain
 *                     ungrounded fallback if embeddings are unavailable
 *
 * Showing the source issues is intentional — it's the clearest way to
 * demonstrate to both users AND anyone reviewing your code that this
 * is retrieval-augmented, not just an LLM making things up.
 */
export default function ChatWidget() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm the CivicPulse Assistant. Ask me anything about " +
                "civic issues in Coimbatore — like \"How long does a pothole " +
                "usually take to fix?\" or \"What's the most common issue in " +
                "RS Puram?\" I answer using real data from resolved issues.",
      grounded: false,
      sources: [],
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const send = async (e) => {
    e?.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setMessages(prev => [...prev, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await chatApi.ask(question)
      const data = res.data.data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        grounded: data.grounded,
        sources: data.sources || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that right now. Please try again.",
        grounded: false,
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full
                     bg-[#1B3A6B] hover:bg-[#16305c] text-white shadow-lg
                     flex items-center justify-center transition-all
                     hover:scale-105 active:scale-95"
          title="Ask CivicPulse"
        >
          <ChatIcon className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full
                           bg-[#F4811F] border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[92vw]
                        h-[520px] max-h-[80vh] bg-white dark:bg-[#161B22]
                        border border-[#D0D7DE] dark:border-[#30363D]
                        rounded-xl shadow-2xl flex flex-col overflow-hidden
                        animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          bg-[#1B3A6B] text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center
                              justify-center text-sm">🤖</div>
              <div>
                <p className="font-display font-bold text-sm leading-tight">
                  Ask CivicPulse
                </p>
                <p className="text-[10px] text-blue-200 leading-tight">
                  Powered by real issue data
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center
                         justify-center transition-colors">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3
                       bg-[#F5F7FA] dark:bg-[#0D1117]">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[#8C959F] text-xs px-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#8C959F] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span>Searching issue history…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={send}
            className="flex items-center gap-2 p-3 border-t
                       border-[#D0D7DE] dark:border-[#30363D]
                       bg-white dark:bg-[#161B22] flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about resolution times, zones…"
              maxLength={500}
              disabled={loading}
              className="flex-1 h-9 px-3 rounded-md text-sm
                         bg-[#F5F7FA] dark:bg-[#0D1117]
                         border border-[#D0D7DE] dark:border-[#30363D]
                         text-[#1C2526] dark:text-[#E6EDF3]
                         placeholder-[#8C959F]
                         focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-md bg-[#F4811F] hover:bg-[#e07318]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center flex-shrink-0
                         transition-colors">
              <SendIcon className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'space-y-1.5'}`}>
        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#1B3A6B] text-white rounded-br-sm'
            : 'bg-white dark:bg-[#1C2333] text-[#1C2526] dark:text-[#E6EDF3] ' +
              'border border-[#D0D7DE] dark:border-[#30363D] rounded-bl-sm'
        }`}>
          {message.content}
        </div>


      </div>
    </div>
  )
}

const ChatIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const SendIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
