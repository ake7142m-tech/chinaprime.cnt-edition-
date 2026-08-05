'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    setAbortController(controller);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (conversationId) {
        headers['makers-conversation-id'] = conversationId;
      }

      const res = await fetch('/agents/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'conversation_id' && parsed.conversationId) {
              setConversationId(parsed.conversationId);
            } else if (parsed.type === 'text' && parsed.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return updated;
              });
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content || 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
          }
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  }

  async function handleStop() {
    if (!conversationId) {
      abortController?.abort();
      setStreaming(false);
      return;
    }

    try {
      await fetch('/agents/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'makers-conversation-id': conversationId,
        },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch {
      // Ignore stop errors
    }

    abortController?.abort();
    setStreaming(false);
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center font-thai text-lg shadow-lg hover:opacity-90 transition-opacity duration-150"
        aria-label="เปิดแชท"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white border border-neutral-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 font-thai font-bold text-sm flex items-center justify-between">
            <span>แชทผู้ช่วย AI</span>
            {streaming && (
              <button
                onClick={handleStop}
                className="bg-white text-primary text-xs px-2 py-1 rounded font-thai hover:bg-neutral-100 transition-colors duration-150"
              >
                หยุด
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
            {messages.length === 0 && (
              <p className="font-thai text-sm text-neutral-400 text-center py-8">
                สวัสดี! มีอะไรให้ช่วยไหม?
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`font-thai text-sm p-2 rounded ${
                  msg.role === 'user'
                    ? 'bg-primary text-white ml-8'
                    : 'bg-neutral-100 text-neutral-800 mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="พิมพ์ข้อความ..."
              className="input-flat flex-1 text-sm"
              disabled={streaming}
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              className="btn-primary text-sm px-4 disabled:opacity-50"
            >
              ส่ง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
