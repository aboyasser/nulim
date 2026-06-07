'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    window.localStorage.setItem('nulim_chat_messages', JSON.stringify(messages));
    window.sessionStorage.setItem('nulim_chat_gender', gender);
  }, [messages, gender]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300/80">NULIM • نُلِم</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-50 sm:text-4xl">مستشار القبول الجامعي السعودي</h1>
              <p className="mt-3 max-w-2xl text-slate-400 sm:text-base">استخدم محادثة إرشادية تعتمد على بيانات القبول المحلية للتوجيه الجامعي العربي.</p>
            </div>
            <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm font-semibold text-teal-100 transition hover:bg-teal-500/20">العودة إلى الصفحة الرئيسية</Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-teal-300/80">الشرح</p>
              <h2 className="text-2xl font-semibold text-white">ابدأ المحادثة مع نُلِم</h2>
              <p className="text-slate-400">أدخل درجاتك ورغبتك، وسأقترح لك خيارات جامعات وبرامج مناسبة بناءً على البيانات المحلية.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 transition hover:border-teal-400/60 hover:bg-slate-700/90"
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
                  className={`rounded-2xl px-4 py-3 text-sm ${gender === 'male' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
                  onClick={() => setGender('male')}
                >
                  طالب
                </button>
                <button
                  type="button"
                  className={`rounded-2xl px-4 py-3 text-sm ${gender === 'female' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}
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

            <div className="min-h-[320px] space-y-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 p-4">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div key={index} className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-xl rounded-3xl p-4 text-sm leading-7 ${isUser ? 'bg-teal-500/10 text-slate-100' : 'bg-slate-800 text-slate-200'}`}>
                      {message.typing ? (
                        <div className="flex gap-2">
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-400" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-400 delay-150" />
                          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-teal-400 delay-300" />
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={busy}
                placeholder="اكتب نسبك أو سؤالك هنا..."
                className="min-h-[96px] resize-none rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 outline-none transition focus:border-teal-400/60"
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
                className="inline-flex min-h-[56px] items-center justify-center rounded-3xl bg-teal-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700/60"
              >
                {busy ? 'جارٍ الإرسال...' : 'أرسل'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
