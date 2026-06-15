import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl font-bold text-teal-500/30">404</p>
        <h1 className="text-3xl font-semibold text-white">الصفحة غير موجودة</h1>
        <p className="text-slate-400 leading-7">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-3xl bg-teal-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            العودة للرئيسية
          </Link>
          <Link
            href="/advisor"
            className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 px-6 py-4 text-sm text-slate-200 transition hover:border-teal-400/70"
          >
            ابدأ محادثة جديدة
          </Link>
        </div>
      </div>
    </main>
  );
}
