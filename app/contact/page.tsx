'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FEEDBACK_TYPES = [
  { value: 'suggestion', label: '💡 اقتراح تحسين' },
  { value: 'missing_data', label: '📊 بيانات ناقصة أو خاطئة' },
  { value: 'bug', label: '🐛 مشكلة تقنية' },
  { value: 'other', label: '💬 أخرى' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', type: 'suggestion', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          message: form.message,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || `خطأ في الاتصال (${response.status})`);
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء إرسال الملاحظة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="شعار نُلِم"
              width={40}
              height={40}
              className="rounded-xl transition group-hover:scale-105"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300/70">NULIM</p>
              <p className="text-sm font-semibold text-slate-100">نُلِم</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-2xl px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              الرئيسية
            </Link>
            <Link
              href="/advisor"
              className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-500/20"
            >
              ابدأ المحادثة
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <section className="flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-2xl space-y-10">

          {/* Hero Text */}
          <div className="text-center space-y-4">
            <span className="inline-block rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
              تواصل معنا
            </span>
            <h1 className="text-4xl font-bold text-white sm:text-5xl">اتصل بنا</h1>
            <p className="mx-auto max-w-md text-lg text-slate-400 leading-8">
              نسعد بتلقي استفساراتك واقتراحاتك. تواصل معنا عبر أي من القنوات التالية.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* X Card */}
            <a
              href="https://x.com/nulimaia"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 text-right transition-all duration-300 hover:border-teal-400/40 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-teal-950/30"
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 transition group-hover:bg-teal-400/10">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current text-white" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">منصة إكس</p>
                  <p className="mt-1 text-lg font-bold text-white group-hover:text-teal-300 transition-colors">@nulimaia</p>
                  <p className="mt-1 text-xs text-slate-400 leading-5">تابعنا للاطلاع على آخر التحديثات.</p>
                </div>
              </div>
            </a>

            {/* Email Card */}
            <a
              href="mailto:nulimai@outlook.com"
              className="group relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/80 p-6 text-right transition-all duration-300 hover:border-teal-400/40 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-teal-950/30"
            >
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 transition group-hover:bg-teal-400/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">البريد الإلكتروني</p>
                  <p className="mt-1 text-base font-bold text-white group-hover:text-teal-300 transition-colors break-all">nulimai@outlook.com</p>
                  <p className="mt-1 text-xs text-slate-400 leading-5">راسلنا مباشرة لأي استفسار أو ملاحظة.</p>
                </div>
              </div>
            </a>
          </div>

          {/* Feedback Form */}
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">هل لديك اقتراح لتحسين نُلِم؟</h2>
              <p className="text-sm text-slate-400 leading-6">
                نرحب بأي ملاحظة تساعدنا على تطوير تجربة القبول الجامعي للطلاب في السعودية.
                املأ النموذج وسيصل مباشرةً إلى بريدنا.
              </p>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 px-6 py-8 text-center space-y-3">
                <span className="text-4xl">✅</span>
                <p className="text-lg font-semibold text-teal-300">شكراً لك!</p>
                <p className="text-sm text-slate-400">تم إرسال ملاحظتك مباشرة وبنجاح. نقدّر مساهمتك في تطوير نُلِم.</p>
                <button
                  onClick={() => {
                    setForm({ name: '', type: 'suggestion', message: '' });
                    setSent(false);
                  }}
                  className="mt-2 text-xs text-slate-500 hover:text-teal-400 underline underline-offset-2 transition"
                >
                  إرسال ملاحظة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-250 text-right">
                    <span className="ml-2">⚠️</span>{error}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-name" className="block text-sm font-medium text-slate-300">
                    الاسم <span className="text-slate-600 text-xs">(اختياري)</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    disabled={loading}
                    placeholder="اسمك أو كنيتك"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-type" className="block text-sm font-medium text-slate-300">
                    نوع الملاحظة
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEEDBACK_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        disabled={loading}
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`rounded-2xl border px-3 py-2.5 text-xs font-medium text-right transition ${
                          form.type === t.value
                            ? 'border-teal-500/60 bg-teal-500/10 text-teal-300'
                            : 'border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        } disabled:opacity-50`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-300">
                    الرسالة <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    required
                    disabled={loading}
                    rows={5}
                    placeholder="اكتب ملاحظتك أو اقتراحك هنا…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                      </svg>
                      جارٍ الإرسال...
                    </span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      إرسال الملاحظة
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-600">
                  سيتم إرسال رسالتك مباشرة وبسرية تامة إلى فريق نُلِم.
                </p>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 px-6 text-center">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-slate-500">© 2025 نُلِم — جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-400 transition hover:text-teal-300">الرئيسية</Link>
            <Link href="/advisor" className="text-slate-400 transition hover:text-teal-300">المستشار</Link>
            <Link href="/contact" className="text-teal-300 font-semibold">اتصل بنا</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
