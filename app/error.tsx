'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-6xl">⚠️</p>
        <h1 className="text-3xl font-semibold text-white">حدث خطأ غير متوقع</h1>
        <p className="text-slate-400 leading-7">
          {error.message || 'عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-3xl bg-teal-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
        >
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
