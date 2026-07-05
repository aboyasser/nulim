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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [genderChanged, setGenderChanged] = useState(false);
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
    setGenderChanged(false);
    window.localStorage.removeItem('nulim_chat_messages');
  }, []);

  const handleGenderChange = useCallback((newGender: 'male' | 'female') => {
    if (newGender !== gender) {
      setGender(newGender);
      setGenderChanged(true);
    }
  }, [gender]);

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
    <main className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 shrink-0 border-b border-slate-900 bg-slate-900/80 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="شعار نُلِم"
            width={34}
            height={34}
            className="rounded-lg"
          />
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/85 block leading-none">NULIM</span>
            <span className="text-sm font-semibold text-slate-200 mt-1 block">نُلِم • مستشار القبول</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {/* Quick Actions */}
          <button
            type="button"
            onClick={clearChat}
            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 active:scale-95 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            محادثة جديدة
          </button>
          
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-350 transition hover:bg-slate-800 hover:text-white"
          >
            اتصل بنا
          </Link>
          
          <Link
            href="/"
            className="hidden sm:inline-flex items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/20"
          >
            الرئيسية
          </Link>

          {/* Toggle Sidebar Button (Mobile) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar (RTL: appears on the right of the screen) */}
        <aside className="hidden md:flex w-80 flex-col shrink-0 border-l border-slate-900/60 bg-slate-900/20 p-6 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white">ابدأ المحادثة مع نُلِم</h2>
            <p className="text-xs leading-5 text-slate-400">
              أدخل درجاتك ورغبتك (مثل: نسبتي، قدراتي، تحصيلي والتخصص المطلوب)، وسأقترح لك خيارات البرامج والجامعات المناسبة لك بناءً على بيانات القبول المحلية المحدثة.
            </p>
          </div>

          <hr className="border-slate-900/80" />

          {/* Gender Profile */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-teal-400/80 block">حالة المستخدم (طالب / طالبة)</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                className={`rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${gender === 'male' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10' : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800/80'}`}
                onClick={() => handleGenderChange('male')}
              >
                طالب
              </button>
              <button
                type="button"
                className={`rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${gender === 'female' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10' : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800/80'}`}
                onClick={() => handleGenderChange('female')}
              >
                طالبة
              </button>
            </div>
          </div>

          <hr className="border-slate-900/80" />

          {/* Quick Tips */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4 space-y-3">
            <p className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <span>💡</span> نصائح سريعة
            </p>
            <ul className="list-disc space-y-2 pr-4 text-[11px] text-slate-400 leading-normal">
              <li>اكتب نسبتك، قدراتك، تحصيليتك، ورغبتك.</li>
              <li>يمكنك استخدام Enter للإرسال وShift+Enter لسطر جديد.</li>
              <li>يتم حفظ المحادثة محلياً في المتصفح.</li>
            </ul>
          </div>

          <div className="flex-1" />

          {/* Footer inside sidebar */}
          <div className="text-[10px] text-slate-500 leading-relaxed space-y-2">
            <p>© 2026 نُلِم — أداة استرشادية غير رسمية.</p>
            <div className="flex gap-3">
              <Link href="/" className="hover:text-teal-400 transition">الرئيسية</Link>
              <Link href="/contact" className="hover:text-teal-400 transition">اتصل بنا</Link>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar (Slide-over Drawer) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-teal-300">معلومات المستشار</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white">ابدأ المحادثة مع نُلِم</h2>
            <p className="text-xs leading-5 text-slate-400">
              أدخل درجاتك ورغبتك وسأقترح لك خيارات البرامج والجامعات المناسبة لك بناءً على بيانات القبول المحلية المحدثة.
            </p>
          </div>

          <hr className="border-slate-800" />

          {/* Gender Profile */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-teal-400/80 block">حالة المستخدم (طالب / طالبة)</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                className={`rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${gender === 'male' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10' : 'bg-slate-950/60 border border-slate-800 text-slate-350 hover:bg-slate-800/80'}`}
                onClick={() => {
                  setGender('male');
                  setSidebarOpen(false);
                }}
              >
                طالب
              </button>
              <button
                type="button"
                className={`rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${gender === 'female' ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/10' : 'bg-slate-950/60 border border-slate-800 text-slate-350 hover:bg-slate-800/80'}`}
                onClick={() => {
                  setGender('female');
                  setSidebarOpen(false);
                }}
              >
                طالبة
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Quick Tips */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <p className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <span>💡</span> نصائح سريعة
            </p>
            <ul className="list-disc space-y-2 pr-4 text-[11px] text-slate-400 leading-normal">
              <li>اكتب نسبتك، قدراتك، تحصيليتك، ورغبتك.</li>
              <li>يمكنك استخدام Enter للإرسال وShift+Enter لسطر جديد.</li>
              <li>يتم حفظ المحادثة محلياً في المتصفح.</li>
            </ul>
          </div>

          <div className="flex-1" />

          {/* Navigation links for mobile sidebar */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              onClick={() => setSidebarOpen(false)}
            >
              🏠 العودة للرئيسية
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              onClick={() => setSidebarOpen(false)}
            >
              📞 اتصل بنا
            </Link>
          </div>
        </div>

        {/* Chat Area Workspace */}
        <section className="flex-1 flex flex-col h-full bg-slate-950/30 overflow-hidden relative">
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-1.5"
                    style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
                  >
                    {/* Header line for sender */}
                    <div className="flex items-center gap-1.5 px-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isUser ? 'text-teal-400/80' : 'text-slate-500'}`}>
                        {isUser ? 'أنت' : 'مستشار نُلِم'}
                      </span>
                    </div>

                    {/* Chat Bubble content container */}
                    <div
                      className={`w-full max-w-xl rounded-2xl p-4 shadow-sm text-sm leading-7 transition-all ${
                        isUser
                          ? 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                          : 'bg-teal-950/20 border border-teal-500/10 text-slate-100 rounded-tr-none'
                      }`}
                    >
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
                        <div className="prose-sm max-w-none">{renderMarkdown(message.content)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          </div>

          {/* Error Banner */}
          {error ? (
            <div className="mx-4 md:mx-8 my-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2 max-w-3xl md:mx-auto w-full shrink-0">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}

          {/* Gender Changed Notice */}
          {genderChanged && messages.length > 1 ? (
            <div className="mx-4 md:mx-8 my-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between gap-2 max-w-3xl md:mx-auto w-full shrink-0">
              <span>⚡ غيّرت الفئة — التوصيات السابقة قد تكون لجنس آخر. ابدأ محادثة جديدة للحصول على نتائج دقيقة.</span>
              <button
                type="button"
                onClick={clearChat}
                className="shrink-0 rounded-lg border border-amber-500/30 px-2 py-1 text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
              >
                محادثة جديدة
              </button>
            </div>
          ) : null}


          {/* Bottom Input Section */}
          <div className="p-4 md:p-6 border-t border-slate-900/60 bg-slate-900/20 backdrop-blur-md shrink-0 flex flex-col gap-3">
            <div className="max-w-3xl mx-auto w-full space-y-3">
              
              {/* Quick Suggestions Row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth shrink-0" style={{ direction: 'rtl' }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={busy}
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-teal-500/30 px-3.5 py-1.5 text-xs text-slate-300 transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Text Area & Input Box */}
              <div className="relative flex items-center bg-slate-950/80 border border-slate-850 focus-within:border-teal-500/40 rounded-2xl p-1.5 transition duration-200 shadow-inner">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  disabled={busy}
                  placeholder="اكتب درجاتك ونسبك، أو سؤالك هنا..."
                  className="flex-1 min-h-[44px] max-h-[140px] resize-none bg-transparent px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  onChange={(event) => {
                    setInput(event.target.value);
                    event.target.style.height = 'auto';
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
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
                  className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:scale-100 shrink-0 cursor-pointer"
                >
                  {busy ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>أرسل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </section>

      </div>
    </main>
  );
}

