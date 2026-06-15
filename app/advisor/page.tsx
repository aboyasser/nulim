'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const QUICK_PROMPTS = [
  'نسبتي 90، قدراتي 80، تحصيلي 85 — أريد طب',
  'نسبتي 85، قدراتي 75، تحصيلي 78 — أريد هندسة',
  'نسبتي 75، قدراتي 65، تحصيلي 70 — أريد إدارة أعمال',
  'ما أفضل خيارات البنات؟',
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
  typing?: boolean;
};

type ChatResponse = {
  content?: Array<{ type?: string; text?: string }>;
};

/* ─── Lightweight Markdown → JSX renderer ─── */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];

  function flushUnorderedList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 mr-4 list-disc space-y-1 text-slate-300">
          {listBuffer.map((item, i) => (
            <li key={i}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  function flushOrderedList() {
    if (orderedBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 mr-4 list-decimal space-y-1 text-slate-300">
          {orderedBuffer.map((item, i) => (
            <li key={i}>{inlineFormat(item)}</li>
          ))}
        </ol>
      );
      orderedBuffer = [];
    }
  }

  function inlineFormat(line: string): React.ReactNode {
    // Bold **text** or __text__
    const parts = line.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, i) => {
      if (/^\*\*(.+)\*\*$/.test(part) || /^__(.+)__$/.test(part)) {
        const inner = part.slice(2, -2);
        return <strong key={i} className="font-semibold text-white">{inner}</strong>;
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (/^###\s/.test(line)) {
      flushUnorderedList();
      flushOrderedList();
      elements.push(<h4 key={i} className="mt-3 mb-1 text-sm font-bold text-teal-300">{inlineFormat(line.replace(/^###\s/, ''))}</h4>);
      continue;
    }
    if (/^##\s/.test(line)) {
      flushUnorderedList();
      flushOrderedList();
      elements.push(<h3 key={i} className="mt-3 mb-1 text-base font-bold text-teal-200">{inlineFormat(line.replace(/^##\s/, ''))}</h3>);
      continue;
    }
    if (/^#\s/.test(line)) {
      flushUnorderedList();
      flushOrderedList();
      elements.push(<h2 key={i} className="mt-3 mb-1 text-lg font-bold text-white">{inlineFormat(line.replace(/^#\s/, ''))}</h2>);
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      flushUnorderedList();
      flushOrderedList();
      elements.push(<hr key={i} className="my-3 border-slate-700" />);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\s]*[-•]\s+(.+)/);
    if (ulMatch) {
      flushOrderedList();
      listBuffer.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
    if (olMatch) {
      flushUnorderedList();
      orderedBuffer.push(olMatch[1]);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushUnorderedList();
      flushOrderedList();
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    // Regular paragraph
    flushUnorderedList();
    flushOrderedList();
    elements.push(<p key={i} className="leading-7">{inlineFormat(line)}</p>);
  }

  flushUnorderedList();
  flushOrderedList();
  return <>{elements}</>;
}

export default function AdvisorPage() {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'أهلاً! أنا نُلِم 🎓\n\nاختر طالب/طالبة، ثم أدخل درجاتك ورغبتك وسأرشدك لأفضل الجامعات المناسبة لك.\n\nمثال: «نسبتي 88، قدراتي 76، تحصيلي 82، أريد هندسة»',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved state
  useEffect(() => {
    const saved = window.localStorage.getItem('nulim_chat_messages');
    const savedGender = window.sessionStorage.getItem('nulim_chat_gender');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {
        /* ignore invalid data */
      }
    }
    if (savedGender === 'male' || savedGender === 'female') {
      setGender(savedGender);
    }
  }, []);

  // Persist state
  useEffect(() => {
    window.localStorage.setItem('nulim_chat_messages', JSON.stringify(messages));
    window.sessionStorage.setItem('nulim_chat_gender', gender);
  }, [messages, gender]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer for typing indicator
  useEffect(() => {
    if (busy) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [busy]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content:
          'أهلاً! أنا نُلِم 🎓\n\nاختر طالب/طالبة، ثم أدخل درجاتك ورغبتك وسأرشدك لأفضل الجامعات المناسبة لك.\n\nمثال: «نسبتي 88، قدراتي 76، تحصيلي 82، أريد هندسة»',
      },
    ]);
    setInput('');
    setError('');
    window.localStorage.removeItem('nulim_chat_messages');
  }, []);

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || busy) return;

    setInput('');
    setError('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setBusy(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', typing: true }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          userProfile: { gender },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || `خطأ ${response.status}`);
      }

      const payload = (await response.json()) as ChatResponse;
      const reply = payload.content?.find((block) => block.type === 'text')?.text;
      if (!reply) {
        throw new Error('لم أتلقَّ رداً صالحاً من الخادم.');
      }

      setMessages((prev) => [...prev.filter((message) => !message.typing), { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => prev.filter((message) => !message.typing));
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-teal-950/20 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Image
                  src="/logo.png"
                  alt="شعار نُلِم"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300/80">NULIM • نُلِم</p>
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-4xl">مستشار القبول الجامعي السعودي</h1>
              <p className="mt-3 max-w-2xl text-slate-400 sm:text-base">استخدم محادثة إرشادية تعتمد على بيانات القبول المحلية للتوجيه الجامعي العربي.</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                محادثة جديدة
              </button>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/70 hover:text-white">اتصل بنا</Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-100 transition hover:bg-teal-500/20">العودة للرئيسية</Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-teal-300/80">الشرح</p>
              <h2 className="text-2xl font-semibold text-white">ابدأ المحادثة مع نُلِم</h2>
              <p className="text-slate-400">أدخل درجاتك ورغبتك، وسأقترح لك خيارات جامعات وبرامج مناسبة بناءً على البيانات المحلية.</p>
            </div>
            <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 transition hover:border-teal-400/60 hover:bg-slate-700/90"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
            <div>
              <p className="text-sm font-semibold text-teal-300/90">حالة المستخدم</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-3 text-sm transition ${gender === 'male' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                  onClick={() => setGender('male')}
                >
                  طالب
                </button>
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-3 text-sm transition ${gender === 'female' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                  onClick={() => setGender('female')}
                >
                  طالبة
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
              <p className="font-semibold text-teal-200">نصائح سريعة</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-400">
                <li>اكتب نسبتك، قدراتك، تحصيليتك، ورغبتك.</li>
                <li>يمكنك استخدام Enter للإرسال وShift+Enter لسطر جديد.</li>
                <li>يتم حفظ المحادثة محلياً في المتصفح.</li>
              </ul>
            </div>
          </aside>
        </section>

        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">المحادثة</h2>
                <p className="text-sm text-slate-400">أرسل سؤالك واستلم التوصية الجامعية الذكية.</p>
              </div>
              <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">البيانات المحلية</span>
            </div>

            <div className="min-h-[320px] max-h-[520px] space-y-4 overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div key={index} className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Avatar label */}
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isUser ? 'text-teal-400/60' : 'text-slate-500'}`}>
                      {isUser ? 'أنت' : 'نُلِم'}
                    </span>
                    <div className={`max-w-xl rounded-3xl p-4 text-sm leading-7 ${isUser ? 'bg-teal-500/10 text-slate-100' : 'bg-slate-800 text-slate-200'}`}>
                      {message.typing ? (
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-slate-500">
                            نُلِم يفكر...{elapsed > 0 ? ` (${elapsed}ث)` : ''}
                          </span>
                        </div>
                      ) : isUser ? (
                        <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      ) : (
                        <div className="prose-sm">{renderMarkdown(message.content)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                <span className="ml-2">⚠️</span>{error}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={busy}
                placeholder="اكتب نسبك أو سؤالك هنا..."
                className="min-h-[56px] resize-none rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 outline-none transition focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30"
                onChange={(event) => {
                  setInput(event.target.value);
                  event.target.style.height = 'auto';
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                type="button"
                disabled={busy || !input.trim()}
                onClick={() => sendMessage()}
                className="inline-flex min-h-[56px] items-center justify-center rounded-3xl bg-teal-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700/60 disabled:text-slate-500"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    جارٍ الإرسال...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    أرسل
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
