import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatCircleDots, PaperPlaneRight, ArrowRight, SpinnerGap } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import * as searchApi from '@/services/search';
import type { ConversationalResponse } from '@/services/search';

export function ConversationalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{ role: 'user' | 'ai'; text: string; sources?: ConversationalResponse['sources'] }>
  >([]);

  async function handleAsk() {
    const q = query.trim();
    if (!q || isAsking) return;

    setConversation((prev) => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setIsAsking(true);

    try {
      const { data } = await searchApi.conversationalSearch(q);
      setConversation((prev) => [
        ...prev,
        { role: 'ai', text: data.answer, sources: data.sources },
      ]);
    } catch {
      setConversation((prev) => [
        ...prev,
        { role: 'ai', text: 'I couldn\'t search your memories right now. The AI service may be unavailable.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  const suggestions = [
    'What stories do we have about grandma?',
    'What happened on our family vacations?',
    'Tell me about holiday traditions',
    'What are the earliest memories we\'ve captured?',
  ];

  return (
    <div className="bg-white rounded-xl border border-sand-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sage-50 to-cream-50 px-5 py-3 border-b border-sand-200">
        <div className="flex items-center gap-2">
          <ChatCircleDots size={18} weight="fill" className="text-sage-400" />
          <h3 className="text-sm font-semibold text-walnut-800 font-display">Ask About Your Memories</h3>
        </div>
        <p className="text-[11px] text-walnut-400 mt-0.5 font-body">AI reads through your memories to answer questions naturally</p>
      </div>

      {/* Conversation */}
      <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
        {conversation.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-walnut-400 font-body">Try asking something like:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-body text-walnut-500 bg-cream-100 hover:bg-cream-200 border border-sand-200 hover:border-sand-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {conversation.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={msg.role === 'user' ? 'flex justify-end' : ''}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[80%] bg-terracotta-50 text-walnut-800 rounded-xl rounded-br-sm px-4 py-2.5 text-sm font-body">
                  {msg.text}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-cream-50 rounded-xl rounded-bl-sm px-4 py-3 border border-sand-100">
                    <p className="text-sm text-walnut-700 leading-relaxed font-body whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pl-2 space-y-1">
                      <p className="text-[10px] text-walnut-400 font-body font-medium uppercase tracking-wide">Sources</p>
                      {msg.sources.map((source) => (
                        <button
                          key={source.memory.id}
                          onClick={() => navigate(`/memories/${source.memory.id}`)}
                          className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cream-100 transition-colors group"
                        >
                          <span className="text-xs text-walnut-600 font-body truncate flex-1 group-hover:text-terracotta-600">
                            {source.memory.title}
                          </span>
                          <span className="text-[10px] text-walnut-300 font-body flex-shrink-0">
                            {Math.round(source.score * 100)}%
                          </span>
                          <ArrowRight size={10} className="text-walnut-300 group-hover:text-terracotta-500 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isAsking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-walnut-400">
            <SpinnerGap size={16} className="animate-spin" />
            <span className="text-xs font-body">Searching your memories...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-sand-200 bg-cream-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your family memories..."
            className="flex-1 bg-white border border-sand-200 rounded-lg px-3 py-2 text-sm text-walnut-800 placeholder:text-walnut-400 focus:outline-none focus:ring-2 focus:ring-sage-200 font-body"
          />
          <button
            onClick={handleAsk}
            disabled={!query.trim() || isAsking}
            className="p-2 rounded-lg bg-sage-300 text-white hover:bg-sage-400 disabled:opacity-50 disabled:hover:bg-sage-300 transition-colors"
          >
            <PaperPlaneRight size={16} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
