import Link from 'next/link';
import Image from 'next/image';
import finalOutput from '@/public/data/final_output.json';

const UNIVERSITIES: { name: string; url?: string; badge?: string }[] = [
  { name: 'جامعة الملك سعود', url: 'https://ksu.edu.sa' },
  { name: 'جامعة الملك عبدالعزيز', url: 'https://kau.edu.sa' },
  { name: 'جامعة الإمام محمد بن سعود الإسلامية', url: 'https://imamu.edu.sa' },
  { name: 'جامعة الأميرة نورة بنت عبدالرحمن', url: 'https://pnu.edu.sa' },
  { name: 'جامعة الملك خالد', url: 'https://kku.edu.sa' },
  { name: 'جامعة الطائف', url: 'https://tu.edu.sa' },
  { name: 'جامعة القصيم', url: 'https://qu.edu.sa' },
  { name: 'جامعة المجمعة', url: 'https://mu.edu.sa' },
  { name: 'جامعة تبوك', url: 'https://ut.edu.sa' },
  { name: 'جامعة الجوف', url: 'https://ju.edu.sa' },
  { name: 'جامعة حائل', url: 'https://uoh.edu.sa' },
  { name: 'جامعة الباحة', url: 'https://bu.edu.sa' },
  { name: 'جامعة بيشة', url: 'https://ub.edu.sa' },
  { name: 'جامعة شقراء', url: 'https://su.edu.sa' },
  { name: 'جامعة سطام بن عبدالعزيز', url: 'https://psau.edu.sa' },
  { name: 'جامعة عبدالرحمن بن فيصل', url: 'https://iau.edu.sa' },
  { name: 'جامعة جدة', url: 'https://uj.edu.sa' },
  { name: 'جامعة حفر الباطن', url: 'https://uhb.edu.sa' },
  { name: 'جامعة الحدود الشمالية', url: 'https://nbu.edu.sa' },
  {
    name: 'جامعة الملك سعود بن عبدالعزيز للعلوم الصحية',
    url: 'https://ksau-hs.edu.sa/Arabic/Pages/Home.aspx',
  },
  { name: 'جامعة نجران', url: 'https://portal.nu.edu.sa/ar/home' },
  { name: 'جامعة الملك فيصل', url: 'https://www.kfu.edu.sa/ar/Pages/Home.aspx' },
  { name: 'جامعة طيبة', url: 'https://www.taibahu.edu.sa/' },
  {
    name: 'الأكاديمية الوطنية للصناعات العسكرية',
    url: 'https://adi.edu.sa',
    badge: 'مبتدئ بالتوظيف',
  },
];

// Append newly-merged universities from final_output.json (if present)
const EXTRA_UNIS = (Array.isArray(finalOutput) ? finalOutput : [])
  .filter((u: any) => ['KSAU-HS', 'NU', 'KFU', 'TAIBAH'].includes(u.id))
  .map((u: any) => ({ name: u.name, url: undefined as undefined, badge: undefined as undefined }));

const DISPLAY_UNIVERSITIES = [...UNIVERSITIES, ...EXTRA_UNIS].filter(u => u.name);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 shadow-xl shadow-teal-950/20 backdrop-blur-xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="شعار نُلِم"
                  width={48}
                  height={48}
                  className="rounded-2xl"
                />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300/80">NULIM • نُليم • نلم</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">مستشار القبول الجامعي | نُلِم</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                منصة <strong>نُلِم (Nulim)</strong> هي مستشار القبول الجامعي الذكي الذي يحسب نسبتك الموزونة والمكافئة ويقترح البرامج الجامعية المناسبة في السعودية بناءً على معايير القبول الموحد الرسمية.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/advisor"
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-teal-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 sm:w-auto"
                >
                  ابدأ المحادثة الآن
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 px-6 py-4 text-sm text-slate-200 transition hover:border-teal-400/70 sm:w-auto"
                >
                  كيف يعمل
                </a>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 text-slate-300 shadow-2xl shadow-slate-950/20">
              <h2 className="text-xl font-semibold text-white">الميزات</h2>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400" />
                  حساب النسبة الموزونة والمكافئة تلقائياً.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400" />
                  توصيات بالبرامج المناسبة حسب درجاتك وتخصصك.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400" />
                  تكامل Gemini للردود الذكية باللغة العربية.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400" />
                  واجهة عربية بديهية وسريعة.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Important Disclaimer */}
        <section className="mt-6 rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6 shadow-xl">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="space-y-2 text-sm leading-7 text-amber-200">
              <p className="font-semibold text-amber-300 text-base">تنويه مهم</p>
              <p>
                نُليم هو <strong>مستشار استرشادي فقط</strong>؛ يحسب نسبتك الموزونة ويقترح البرامج المناسبة لدرجاتك.
                هذا لا يُغني عن قراءة الشروط والمتطلبات الرسمية على موقع كل جامعة.
              </p>
              <p>
                يتم القبول الجامعي عبر{' '}
                <a
                  href="https://www.uap.sa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-300 underline underline-offset-2 hover:text-teal-200"
                >
                  المنصة الوطنية للقبول الموحد (uap.sa)
                </a>
                {' '}— تأكد من متابعة المواعيد والشروط المعتمدة هناك.
              </p>
              <p className="text-amber-300/70 text-xs">
                آخر تحديث لبيانات الشروط: <strong>25 / 11 / 1447 هـ</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Timeline & UAP Integration */}
        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-teal-950/5 backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            
            {/* UAP Overview */}
            <div className="space-y-6">
              <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                منصة قَبول الموحدة 🇸🇦
              </span>
              <h2 className="text-2xl font-bold text-white">المنصة الوطنية للقبول الموحد</h2>
              <p className="text-sm leading-7 text-slate-350">
                أطلقت وزارة التعليم منصة القبول الموحدة (قبول) لدمج وتسهيل إجراءات التقديم لأكثر من 28 جهة تعليمية تشمل كافة الجامعات الحكومية والمؤسسة العامة للتدريب التقني والمهني، بالإضافة إلى مسارات الابتعاث الخارجي في بوابة واحدة دون الحاجة لمستندات ورقية.
              </p>
              
              <div className="rounded-2xl border border-slate-850 bg-slate-950/50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">أهم مميزات البوابة:</h3>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-teal-400">✓</span> {"ربط آلي مباشر وموثوق مع نظام \"نور\" ومركز \"قياس\"."}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">✓</span> تقديم موحد لـ 26 جامعة حكومية ومؤسسة التدريب التقني.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">✓</span> إدماج مسارات ابتعاث خادم الحرمين الشريفين (إمداد، الرواد، واعد).
                  </li>
                </ul>
              </div>
              
              <a
                href="https://www.uap.sa/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-800 hover:bg-slate-750 px-6 py-3.5 text-sm font-semibold text-slate-200 transition"
              >
                الدخول للموقع الرسمي (uap.sa) ↗
              </a>
            </div>

            {/* Timeline */}
            <div className="border-t border-slate-800 pt-8 lg:border-t-0 lg:border-r lg:pt-0 lg:pr-8 lg:border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span>⏰</span>
                الجدول الزمني للقبول (1447 هـ / 2026 م)
              </h3>
              
              <div className="relative border-r border-slate-800 mr-2 space-y-6">
                
                {/* Stage 1 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 line-through">تعديل البيانات والملف الشخصي</span>
                    <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-500">منتهي (1 يونيو)</span>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-teal-400 ring-4 ring-teal-950 animate-pulse" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-teal-300">التقديم على الابتعاث الخارجي</span>
                    <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400 font-medium">نشط حالياً (7 يونيو - 10 يوليو)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">التقديم متاح لمسارات (إمداد، الرواد، واعد) للجامعات العالمية.</p>
                </div>

                {/* Stage 3 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-teal-400 ring-4 ring-teal-950 animate-pulse" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-teal-300">فترة المقابلات واختبارات القبول</span>
                    <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-400 font-medium">مستمر حتى 12 يوليو</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">آخر موعد لإدخال الرغبات المشروطة بمقابلة هو 7 يوليو.</p>
                </div>

                {/* Stage 4 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-950" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400">إدخال وترتيب الرغبات الجامعية</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400 font-medium">مستمر حتى 24 يونيو</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">أدخل ورتّب رغباتك للقبول الموحد قبل إغلاق البوابة نهائياً.</p>
                </div>

                {/* Stage 5 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-950" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-amber-400">رصد درجات الثانوية آلياً</span>
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">رصد تلقائي (26 - 27 يونيو)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">يتم رصد وسحب الدرجات تلقائياً بالتكامل مع نظام نور.</p>
                </div>

                {/* Stage 6 */}
                <div className="relative pr-6">
                  <div className="absolute -right-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-950" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-blue-400">إعلان فرص القبول والفرز النهائي</span>
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300">النتائج وتأكيد المقاعد (28 يونيو - 18 يوليو)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">إعلان النتائج النهائية وتأكيد ترشيح المقاعد أو الاستفسار عن المقاعد الشاغرة.</p>
                </div>

              </div>
            </div>
            
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 text-slate-300 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">1. اكتب بياناتك</h2>
            <p className="mt-3 text-sm leading-7">اكتب نسبتك، قدراتك، تحصيليتك، ورغبتك أو سؤال القبول الخاص بك.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 text-slate-300 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">2. احصل على التوصية</h2>
            <p className="mt-3 text-sm leading-7">
              يحسب نُليم نسبتك الموزونة ويوصي بالبرامج المناسبة، مع شرح واضح باللغة العربية.
            </p>
          </div>
        </section>

        {/* Universities Section */}
        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">الجامعات المشمولة بالبيانات</h2>
              <p className="mt-1 text-sm text-slate-400">
                يشمل النظام حالياً بيانات قبول{' '}
                <span className="font-semibold text-teal-300">{DISPLAY_UNIVERSITIES.length} مؤسسة</span> تعليمية سعودية.
              </p>
            </div>
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-300">
              آخر تحديث: 25/11/1447 هـ
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {DISPLAY_UNIVERSITIES.map((uni, index) =>
              uni.url ? (
                <a
                  key={`${uni.name}-${index}`}
                  href={uni.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-teal-500/30 bg-teal-500/5 px-3 py-2.5 text-center text-sm text-teal-300 transition hover:border-teal-400/60 hover:bg-teal-500/10"
                >
                  <span className="block font-medium">{uni.name}</span>
                  {uni.badge && (
                    <span className="mt-1 inline-block rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
                      {uni.badge}
                    </span>
                  )}
                  <span className="mt-1 block text-[10px] text-teal-500/70 opacity-0 transition-opacity group-hover:opacity-100 font-mono">
                    {uni.url.replace(/^https?:\/\/(www\.)?/, '')} ↗
                  </span>
                </a>
              ) : (
                <div
                  key={`${uni.name}-${index}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-center text-sm text-slate-300"
                >
                  {uni.name}
                </div>
              )
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-6 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">الأسئلة الشائعة حول منصة نلم (FAQ)</h2>
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-950/60 p-5 border border-slate-850">
              <h3 className="text-base font-semibold text-teal-300 mb-2">ما هي منصة نلم (Nulim)؟</h3>
              <p className="text-sm text-slate-300 leading-6">
                منصة نلم هي مستشار قبول جامعي ذكي يعتمد على تقنيات الذكاء الاصطناعي لمساعدة خريجي الثانوية العامة في السعودية على معرفة خيارات القبول المتاحة لهم بناءً على درجاتهم (ثانوية، قدرات، تحصيلي).
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 p-5 border border-slate-850">
              <h3 className="text-base font-semibold text-teal-300 mb-2">كيف أحسب النسبة الموزونة للجامعات السعودية؟</h3>
              <p className="text-sm text-slate-300 leading-6">
                يمكنك كتابة درجاتك مباشرة في مستشار نلم الذكي (مثال: &quot;درجاتي 90 ثانوية، 80 قدرات، 85 تحصيلي&quot;)، وسيقوم النظام تلقائياً بحساب النسبة الموزونة والمكافئة لكل جامعة وتخصص بناءً على المعايير الرسمية المعتمدة لكل منها.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 p-5 border border-slate-850">
              <h3 className="text-base font-semibold text-teal-300 mb-2">هل نتائج وتوصيات منصة نلم رسمية؟</h3>
              <p className="text-sm text-slate-300 leading-6">
                لا، منصة نلم هي أداة استرشادية ذكية تهدف لتسهيل عملية البحث وتقليل الحيرة لدى الطلاب وأولياء الأمور. يجب دائماً مراجعة بوابات القبول الرسمية وتأكيد التقديم عبر المنصة الوطنية الموحدة للقبول (uap.sa).
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/60 p-5 border border-slate-850">
              <h3 className="text-base font-semibold text-teal-300 mb-2">ما هي الجامعات والكليات المشمولة في منصة نلم؟</h3>
              <p className="text-sm text-slate-300 leading-6">
                تشمل المنصة بيانات أكثر من 21 مؤسسة تعليمية حكومية سعودية، بما في ذلك الجامعات المدنية الكبرى والكليات العسكرية التابعة لوزارة الدفاع والحرس الوطني، بالإضافة إلى برامج التدريب المنتهي بالتوظيف.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "ما هي منصة نلم (Nulim)؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "منصة نلم هي مستشار قبول جامعي ذكي يعتمد على تقنيات الذكاء الاصطناعي لمساعدة خريجي الثانوية العامة في السعودية على معرفة خيارات القبول المتاحة لهم بناءً على درجاتهم (ثانوية، قدرات، تحصيلي)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "كيف أحسب النسبة الموزونة للجامعات السعودية؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "يمكنك كتابة درجاتك مباشرة في مستشار نلم الذكي (مثال: \"درجاتي 90 ثانوية، 80 قدرات، 85 تحصيلي\")، وسيقوم النظام تلقائياً بحساب النسبة الموزونة والمكافئة لكل جامعة وتخصص بناءً على المعايير الرسمية المعتمدة لكل منها."
                  }
                },
                {
                  "@type": "Question",
                  "name": "هل نتائج وتوصيات منصة نلم رسمية؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "لا، منصة نلم هي أداة استرشادية ذكية تهدف لتسهيل عملية البحث وتقليل الحيرة لدى الطلاب وأولياء الأمور. يجب دائماً مراجعة بوابات القبول الرسمية وتأكيد التقديم عبر المنصة الوطنية الموحدة للقبول (uap.sa)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "ما هي الجامعات والكليات المشمولة في منصة نلم؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "تشمل المنصة بيانات أكثر من 21 مؤسسة تعليمية حكومية سعودية، بما في ذلك الجامعات المدنية الكبرى والكليات العسكرية التابعة لوزارة الدفاع والحرس الوطني، بالإضافة إلى برامج التدريب المنتهي بالتوظيف."
                  }
                }
              ]
            })
          }}
        />

        <footer className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-600">
            نُليم • أداة استرشادية غير رسمية — القبول الرسمي عبر{' '}
            <a href="https://www.uap.sa/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-teal-400">
              uap.sa
            </a>
          </p>
          <nav className="flex items-center gap-5 text-xs">
            <Link href="/advisor" className="text-slate-500 hover:text-teal-300 transition-colors">المستشار</Link>
            <Link href="/contact" className="text-slate-500 hover:text-teal-300 transition-colors">اتصل بنا</Link>
            <a href="https://x.com/nulimaia" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-teal-300 transition-colors">@nulimaia</a>
          </nav>
        </footer>

      </div>
    </main>
  );
}
