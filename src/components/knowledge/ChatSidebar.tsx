import { useState, useEffect, useRef } from "react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
}

export default function ChatSidebar({ tagSlug, onClose }: { tagSlug: string, onClose: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, [tagSlug]);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/knowledge/chat/sessions?tagSlug=${tagSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/knowledge/chat/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Hapus sesi chat ini?")) return;
    try {
      const res = await fetch(`/api/knowledge/chat/sessions?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (activeSessionId === id) {
          setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createSession = async () => {
    try {
      const res = await fetch(`/api/knowledge/chat/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagSlug, title: `Diskusi ${new Date().toLocaleDateString()}` })
      });
      if (res.ok) {
        const doc = await res.json();
        setSessions([doc, ...sessions]);
        setActiveSessionId(doc.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      // Create session first
      try {
        const res = await fetch(`/api/knowledge/chat/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagSlug, title: input.substring(0, 30) + '...' })
        });
        if (res.ok) {
          const doc = await res.json();
          setSessions([doc, ...sessions]);
          setActiveSessionId(doc.id);
          sessionId = doc.id;
        }
      } catch (e) {
        console.error(e);
        return;
      }
    }

    const currentInput = input;
    setInput("");
    
    // Optimistic UI for user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content })); // send last 10 messages for context
      const res = await fetch(`/api/knowledge/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, tagSlug, content: currentInput, history })
      });
      if (res.ok) {
        const aiMsg = await res.json();
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan saat memproses jawaban. Silakan coba lagi.',
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 border-l border-outline-variant bg-surface flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
          Tanya Buku Ini
        </h3>
        <button onClick={onClose} className="text-secondary hover:text-on-surface">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="p-2 border-b border-outline-variant bg-surface-container-lowest flex gap-2 overflow-x-auto">
        <button 
          onClick={createSession}
          className="shrink-0 bg-primary/10 text-primary px-3 py-1.5 rounded text-xs font-medium hover:bg-primary/20 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span> Sesi Baru
        </button>
        {sessions.map(s => (
          <div key={s.id} className={`shrink-0 flex items-center rounded text-xs transition-colors ${activeSessionId === s.id ? 'bg-surface-container-highest text-on-surface font-medium' : 'bg-surface hover:bg-surface-container text-secondary'}`}>
            <button 
              onClick={() => setActiveSessionId(s.id)}
              className="px-3 py-1.5 truncate max-w-[100px]"
            >
              {s.title}
            </button>
            {activeSessionId === s.id && (
              <button 
                onClick={() => deleteSession(s.id)}
                className="pr-2 py-1.5 opacity-50 hover:opacity-100 text-error flex items-center"
                title="Hapus Sesi"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-container-lowest">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-secondary p-4">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">forum</span>
            <p className="text-sm">Mulai tanya-tanya tentang isi buku ini. AI akan mencari bagian teks yang relevan untuk menjawab Anda.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex flex-col max-w-[90%] ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-container border border-outline-variant text-on-surface rounded-tl-sm'}`}>
                {m.content}
              </div>
              <span className="text-[10px] text-secondary mt-1 px-1">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        {isLoading && (
          <div className="self-start items-start flex flex-col max-w-[90%]">
             <div className="p-3 rounded-2xl text-sm bg-surface-container border border-outline-variant text-on-surface rounded-tl-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-outline-variant bg-surface">
        <form 
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2 items-end"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Tanya soal buku ini..."
            className="flex-1 bg-surface-container border border-outline px-3 py-2 rounded-xl text-sm min-h-[40px] max-h-[120px] focus:border-primary focus:outline-none resize-none"
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-on-primary h-10 w-10 shrink-0 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
