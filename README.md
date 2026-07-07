# نُلِم 🎓

![Nulim Banner](./public/nulim-banner.png) <!-- Optional banner image placeholder -->

<div align="center">
  <p><strong>مستشار القبول الجامعي السعودي الذكي</strong></p>
  <p>
    <a href="https://github.com/aboyasser/nulim/stargazers"><img src="https://img.shields.io/github/stars/aboyasser/nulim?style=flat-square&color=blue" alt="Stars"/></a>
    <a href="https://github.com/aboyasser/nulim/network/members"><img src="https://img.shields.io/github/forks/aboyasser/nulim?style=flat-square&color=blue" alt="Forks"/></a>
    <a href="https://github.com/aboyasser/nulim/issues"><img src="https://img.shields.io/github/issues/aboyasser/nulim?style=flat-square&color=blue" alt="Issues"/></a>
  </p>
</div>

---

## 🌟 نبذة عن المشروع

**نُلِم** هو تطبيق ويب ذكي مبني باستخدام **Next.js**، يهدف إلى مساعدة الطلاب في المملكة العربية السعودية على معرفة فرص قبولهم في الجامعات المختلفة. التطبيق يتميز بواجهة عربية بالكامل ويعتمد على حسابات محلية دقيقة بناءً على بيانات الجامعات، مع إمكانية اختيارية لتحسين جودة الصياغة وردود النظام باستخدام نماذج الذكاء الاصطناعي (Gemini).

## ✨ المميزات الرئيسية

- **🌐 واجهة مستخدم عربية:** تصميم مخصص وسهل الاستخدام للطلاب.
- **⚡ حساب دقيق ومحلي:** يعتمد على `API` داخلي لحساب نسب القبول والتوصيات بناءً على بيانات مهيكلة وموثوقة.
- **🤖 دعم الذكاء الاصطناعي (اختياري):** تكامل مع واجهة برمجة تطبيقات `Gemini` لتحسين صياغة الردود وإعطاء تجربة حوارية أكثر سلاسة.
- **📄 استخراج البيانات الذكي:** أدوات مدمجة لتحويل بيانات القبول من ملفات PDF إلى نصوص مهيكلة `JSON`.

## 🛠 التقنيات المستخدمة

- **إطار العمل:** Next.js (React)
- **التصميم:** TailwindCSS
- **الذكاء الاصطناعي:** Google Gemini API
- **البيانات:** JSON محلي

## 📁 هيكلية المشروع

```text
nulim/
├── app/                  # صفحات ومكونات واجهة المستخدم (Next.js App Router)
├── data/                 # ملفات البيانات المهيكلة (JSON) المستخرجة من الجامعات
├── lib/                  # الأكواد المساعدة والدوال الأساسية لمعالجة البيانات
├── public/               # الملفات الثابتة (الصور، الأيقونات، إلخ)
├── scripts/              # سكربتات مساعدة (مثل استخراج البيانات من PDF)
└── README.md             # ملف التوثيق الحالي
```

## 🚀 البدء السريع (Getting Started)

### المتطلبات المسبقة
- Node.js إصدار `18` أو أحدث.
- حساب Google للحصول على مفتاح `Gemini API` (في حال الرغبة بتفعيل تحسين الصياغة).

### التشغيل المحلي

1. **تثبيت الحزم:**
   ```bash
   npm install
   ```
2. **تشغيل بيئة التطوير:**
   ```bash
   npm run dev
   ```
3. افتح المتصفح على [http://localhost:3000](http://localhost:3000).

## ⚙️ متغيرات البيئة (Environment Variables)

لإعداد المشروع محلياً، قم بنسخ ملف `.env.example` إلى `.env.local` وأضف القيم المطلوبة:

```bash
cp .env.example .env.local
```

### استخدام الذكاء الاصطناعي (Gemini)

بشكل افتراضي، لا يستهلك التطبيق أي `API` خارجي لتوفير التكاليف وضمان سرعة الاستجابة. الإعدادات الافتراضية تكون كالتالي:

```env
GEMINI_RESPONSE_MODE=off
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

لتفعيل صياغة `Gemini` لجميع الردود، قم بتغيير القيمة إلى:
```env
GEMINI_RESPONSE_MODE=always
```
*(يمكن أيضاً تفعيله لطلب محدد فقط عن طريق إرسال `enhanceWithGemini: true` إلى نقطة النهاية `/api/chat`).*

## 📊 بيانات القبول (Admission Data)

مصدر البيانات الأساسي للتوصيات والحسابات هو ملف `data/final_output.json`. 
أما ملف `trainedData.md` (الموجود في جذر المشروع أو المجلد الأعلى) فيُستخدم كمصدر معرفة نصية إضافي فقط، ولا يستبدل البيانات المهيكلة.

تُستمد هذه البيانات من ملفات PDF الموجودة في المسار `../pdfs`.

### تحديث البيانات واستخراجها

لإعادة استخراج النصوص وتحديث بيانات التطبيق، استخدم الأمر التالي:
```bash
npm run extract:admissions
```

**المخرجات المتوقعة من السكربت:**
- `trainedData.md`: مصدر معرفة نصية للمحادثة.
- `public/data/final_output.json`: نسخة JSON محلية للبيانات المهيكلة.
- `data/final_output.json`: مصدر احتياطي للكود والمحادثة.
- `data/extraction_report.json`: تقرير جودة استخراج النصوص لكل PDF.
- `../txt/*.txt`: نصوص وسيطة للمراجعة اليدوية.

> **ملاحظة:** بعض ملفات الـ PDF قد تكون عبارة عن صور (بدون نصوص قابلة للتحديد). سيُظهر التقرير حالتها كـ `existing_txt_fallback_needs_ocr` أو `poor_pdf_text_needs_ocr`. تتطلب هذه الملفات استخدام أدوات التعرف البصري على الحروف (OCR) لدعم اللغة العربية قبل الاعتماد عليها بالكامل.

## ✅ فحص الإنتاج (Production Check)

قبل رفع المشروع إلى بيئة الإنتاج، يُنصح بتشغيل أمر الفحص للتأكد من عدم وجود أخطاء:
```bash
npm run check
```

## 🌍 النشر (Deployment)

تعتبر [Vercel](https://vercel.com) المنصة الأفضل لاستضافة هذا المشروع بفضل دعمها المدمج لـ `Next.js API Routes`.

**خطوات النشر على Vercel:**
1. قم برفع مستودع `nulim` إلى حسابك على GitHub.
2. في لوحة تحكم Vercel، اختر **Import Project**.
3. أضف متغيرات البيئة (الموجودة في `.env.example`)، وأهمها `GEMINI_API_KEY`.
4. تأكد من إعدادات البناء:
   - **Framework Preset:** `Next.js`
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** *(اتركها فارغة)*
5. اضغط على **Deploy**.

**التشغيل على خادم Node.js تقليدي:**
```bash
npm install
npm run build
npm run start
```

## 🤝 المساهمة (Contributing)

نرحب بجميع المساهمات لتحسين "نُلِم"! 
إذا كانت لديك فكرة أو إصلاح لمشكلة، يرجى اتباع الخطوات التالية:
1. قم بعمل `Fork` للمشروع.
2. أنشئ فرعاً جديداً لميزتك (`git checkout -b feature/AmazingFeature`).
3. احفظ التغييرات (`git commit -m 'Add some AmazingFeature'`).
4. ارفع الفرع إلى مستودعك (`git push origin feature/AmazingFeature`).
5. افتح `Pull Request` جديد.
