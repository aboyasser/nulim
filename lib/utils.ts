/**
 * أدوات مشتركة — نُلِم
 *
 * دوال مساعدة موحّدة تُستخدم عبر كامل المشروع بدلاً من تكرارها
 * في عدة ملفات.
 */

/**
 * يُطبّع النص العربي: يزيل التشكيل، يوحّد الهمزات والتاء المربوطة،
 * يحذف علامات الترقيم، ويحوّل إلى أحرف صغيرة.
 *
 * هذه النسخة الموحّدة تُغطي كل الحالات التي كانت موزّعة سابقاً
 * على local-advisor.ts و json-knowledge.ts و route.ts.
 */
export function normalizeArabic(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة التشكيل
    .replace(/[إأآ]/g, "ا")               // توحيد الهمزات
    .replace(/ة/g, "ه")                    // التاء المربوطة → هاء
    .replace(/[_\-]+/g, " ")               // شرطات → مسافات
    .replace(/[^\p{L}\p{N}\s]/gu, " ")     // حذف علامات الترقيم
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * يكتشف الجنس من النص العربي مع احتياطي من الـ profile.
 */
export function parseGender(
  text: string,
  profileGender?: string
): "male" | "female" | undefined {
  const normalized = normalizeArabic(text);

  // فحص النص أولاً — الأولوية للكلمات الصريحة في الرسالة
  if (/(^|\s)(ال)?(طالبه|طالبة|بنت|بنات|انثى|اناث|انثه)(\s|$)/.test(normalized)) {
    return "female";
  }
  if (
    /(^|\s)(ال)?(طالب|ولد|اولاد|ذكر|ذكور)(\s|$)/.test(normalized) &&
    !/(طالبه|طالبات)/.test(normalized)
  ) {
    return "male";
  }

  // لا يوجد تصريح في النص — نعتمد على الـ profile كاحتياطي
  if (profileGender === "male") return "male";
  if (profileGender === "female") return "female";

  return undefined;
}

/**
 * يحدد إذا كان البرنامج مخصصاً للطلاب فقط (يُحذف عند female).
 */
export function isMaleOnly(rawGender: string | undefined): boolean {
  if (!rawGender) return false;
  const g = rawGender
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآ]/g, "ا");
  if (g.includes("طالبات")) return false;
  return (
    /طلاب\s*فقط/.test(g) ||
    /\(طلاب\)/.test(g) ||
    /للطلاب\b/.test(g) ||
    /^الطلاب$/.test(g.trim()) ||
    g.includes("طلاب")
  );
}

/**
 * يحدد إذا كان البرنامج مخصصاً للطالبات فقط (يُحذف عند male).
 */
export function isFemaleOnly(rawGender: string | undefined): boolean {
  if (!rawGender) return false;
  const g = rawGender
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآ]/g, "ا");
  if (g.includes("طلاب")) return false;
  return (
    /طالبات\s*فقط/.test(g) ||
    /\(طالبات\)/.test(g) ||
    /للطالبات\b/.test(g) ||
    /^الطالبات$/.test(g.trim()) ||
    g.includes("طالبات")
  );
}
