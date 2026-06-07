# نُلِم

مستشار قبول جامعي ذكي مبني بـ Next.js. الواجهة عربية، وتستخدم API داخلي يعتمد أساساً على حساب محلي من بيانات الجامعات، مع إمكانية اختيارية لتحسين الصياغة عبر Gemini.

## Getting Started

ثبت الحزم وشغل بيئة التطوير:

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## Environment Variables

انسخ `.env.example` إلى `.env.local` محلياً، وأضف القيم المطلوبة:

```bash
cp .env.example .env.local
```

Gemini اختياري، والوضع الافتراضي لا يستهلك API:

```bash
GEMINI_RESPONSE_MODE=off
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

لتفعيل صياغة Gemini لكل الردود، استخدم `GEMINI_RESPONSE_MODE=always`. يمكن أيضاً تفعيله لطلب واحد فقط بإرسال `enhanceWithGemini: true` إلى `/api/chat`.

## Production Check

قبل النشر شغل:

```bash
npm run check
```

## Admission Data

مصدر البيانات الأساسي للتوصيات والحساب هو `data/final_output.json`. أما `trainedData.md` في جذر المشروع أو المجلد الأعلى فيستخدم كمصدر معرفة نصية إضافي فقط، ولا يستبدل بيانات JSON المهيكلة.

مصدر بيانات القبول هو ملفات PDF الموجودة في مجلد `../pdfs`.

لإعادة استخراج النصوص وتحديث بيانات التطبيق:

```bash
npm run extract:admissions
```

ينتج السكربت:

- `trainedData.md`: مصدر معرفة نصية إضافي للمحادثة عند وجوده في جذر المشروع أو المجلد الأعلى.
- `public/data/final_output.json`: نسخة JSON محلية للبيانات المهيكلة.
- `data/final_output.json`: مصدر احتياطي يستخدمه كود `lib/` وواجهة المحادثة عند عدم توفر `trainedData.md`.
- `data/extraction_report.json`: تقرير جودة الاستخراج لكل PDF.
- `../txt/*.txt`: نصوص وسيطة للمراجعة.

ملاحظة: بعض ملفات PDF تكون صورًا بدون نص قابل للقراءة. سيضع التقرير حالتها كـ `existing_txt_fallback_needs_ocr` أو `poor_pdf_text_needs_ocr`، وهذه تحتاج OCR عربي قبل الاعتماد الكامل عليها.

## Deploy

أفضل استضافة لهذا المشروع هي Vercel لأنها تدعم Next.js API Routes مباشرة.

1. ارفع مجلد المشروع `nulim` إلى GitHub.
2. في Vercel اختر Import Project.
3. أضف Environment Variables الموجودة في `.env.example`، وأهمها `GEMINI_API_KEY`.
4. إعدادات البناء:
   - Framework Preset: `Next.js`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: اتركها فارغة
5. اضغط Deploy.

للتشغيل على سيرفر Node:

```bash
npm install
npm run build
npm run start
```
