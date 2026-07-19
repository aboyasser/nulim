import { UNIVERSITIES_DATA } from "@/lib/universities";
import {
  getPrimaryDataSourceName,
  getUniversitiesData,
  type ProgramItem,
  type UniversityItem,
} from "@/lib/data-source";
import {
  normalizeArabic,
  parseGender,
} from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ParsedScores = {
  secondary?: number;
  qiyas?: number;
  tahsili?: number;
};

export type AdvisorRecommendation = {
  university: string;
  programName: string;
  college?: string;
  degree?: string;
  campus?: string;
  campusType?: string;
  city?: string;
  region?: string;
  track?: string;
  minimumText: string | number;
  formulaText: string;
  gender?: string;
  calculatedScore?: number;
  minimum?: number;
  chance: string;
  diff?: number;
  requirements: string[];
};

export type AdvisorSummary = {
  latestUserMessage: string;
  mentionedUniversity?: string;
  mentionedUniversities: string[];
  scores: ParsedScores;
  weighted?: number;
  equivalent?: number;
  requestedGender?: "male" | "female";
  requestedDegree?: string;
  requestedLocation?: string;
  requestedCount?: number;
  recommendations: AdvisorRecommendation[];
  dataCoverage: {
    totalUniversities: number;
    structuredUniversities: number;
    structuredUniversityNames: string[];
    isComplete: boolean;
  };
  universityContexts: {
    university: string;
    source: string;
    excerpt: string;
  }[];
};

export type UserProfile = {
  gender?: "male" | "female" | "غير محدد" | string;
};

const INTEREST_KEYWORDS = [
  // عبارات مركبة — يجب أن تأتي أولاً (الأطول والأكثر تحديداً)
  "الأكاديمية الوطنية للصناعات العسكرية",
  "صناعات عسكرية",
  "دفاع جوي",
  "مراقبة جوية",
  "طائرة مسيرة",
  "أنظمة التسليح",
  "انظمة التسليح",
  "توجيه المقاتلات",
  "نظم المعلومات الإدارية",
  "نظم المعلومات",
  "نظم معلومات",
  "علوم الحاسب",
  "هندسة الحاسب",
  "هندسة البرمجيات",
  "أمن المعلومات",
  "أمن سيبراني",
  "ذكاء اصطناعي",
  "تعلم آلي",
  // التخصصات الطبية المحددة
  "أسنان",
  "عيون",
  "جراحة",
  "صيدلة",
  "صيدله",
  "صيدلي",
  "تمريض",
  "طوارئ",
  "قبالة",
  "قباله",
  "قلب",
  "كلى",
  "عظام",
  "أنف",
  "أذن",
  // الكلمات العامة
  "عسكري",
  "عسكرية",
  "عسكر",
  "طيار",
  "طيران",
  "جوية",
  "بحرية",
  "حربية",
  "إمداد",
  "امداد",
  "طب",
  "صحي",
  "الجراحة",
  "هندسة",
  "الحاسب",
  "حاسب",
  "تقنية",
  "ذكاء",
  "اصطناعي",
  "صناعي",
  "سيبراني",
  "بيانات",
  "تحليل",
  "إحصاء",
  "احصاء",
  "قانون",
  "شريعة",
  "إدارة",
  "ادارة",
  "أعمال",
  "اعمال",
  "لغات",
  "تربية",
  "علوم",
  "علاج",
  "وظيفي",
  "تأهيل",
  "تنفسي",
  "رياضة",
  "بدني",
  "دبلوم",
  "بكالوريوس",
];

const REGION_ALIASES: Record<string, string[]> = {
  "المنطقة الوسطى": ["الوسطى", "الرياض", "القصيم", "المجمعة", "شقراء", "الخرج", "الدرعية", "بريدة"],
  "منطقة مكة المكرمة": ["مكة", "جدة", "الطائف", "رابغ"],
  "المنطقة الشرقية": ["الشرقية", "الدمام", "الخبر", "الأحساء", "الاحساء", "حفر الباطن"],
  "المنطقة الشمالية": ["الشمالية", "تبوك", "الجوف", "عرعر", "رفحاء", "طريف", "حائل"],
  "المنطقة الجنوبية": ["الجنوبية", "أبها", "ابها", "الباحة", "بيشة", "عسير", "نجران"],
};

const UNIVERSITY_ALIASES: Record<string, string[]> = {
  UQU: ["أم القرى", "ام القرى", "جامعة أم القرى", "جامعة ام القرى"],
  KSAU_HS: [
    "جامعة الملك سعود بن عبدالعزيز للعلوم الصحية",
    "العلوم الصحية",
    "الحرس",
  ],
  KSU: ["جامعة الملك سعود", "الملك سعود"],
  KAU: ["جامعة الملك عبدالعزيز", "الملك عبدالعزيز"],
  IMSIU: ["جامعة الإمام محمد بن سعود", "جامعة الامام محمد بن سعود", "الإمام", "الامام"],
  PSAU: ["جامعة الأمير سطام", "جامعة الامير سطام", "جامعة سطام", "سطام"],
  IU: [
    "الجامعة الإسلامية بالمدينة المنورة",
    "الجامعة الاسلامية بالمدينة المنورة",
    "الجامعة الإسلامية",
    "الجامعة الاسلامية",
    "إسلامية المدينة",
    "اسلامية المدينة",
  ],
  JAZAN: ["جامعة جازان", "جامعة جيزان", "جازان", "جيزان"],
};

const SIGNAL_LINE_REGEX =
  /(النسبة|الموزونة|المكافئة|ثانوية|قدرات|تحصيلي|قبول|تخصص|تخصصات|كلية|المسار|طلاب|طالبات|ذكور|إناث|اناث|بكالوريوس|دبلوم|طب|هندسة|حاسب)/i;

function extractNumbers(text: string): number[] {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);
}

function parseScores(text: string): ParsedScores {
  const secondaryMatch = text.match(/(?:نسبتي|الثانوية|ثانويتي)\D{0,20}(\d+(?:\.\d+)?)/);
  const qiyasMatch = text.match(/(?:قدراتي|القدرات|قدرات)\D{0,20}(\d+(?:\.\d+)?)/);
  const tahsiliMatch = text.match(/(?:تحصيلي|التحصيلي)\D{0,20}(\d+(?:\.\d+)?)/);
  const numbers = extractNumbers(text);

  return {
    secondary: secondaryMatch ? Number(secondaryMatch[1]) : numbers[0],
    qiyas: qiyasMatch ? Number(qiyasMatch[1]) : numbers[1],
    tahsili: tahsiliMatch ? Number(tahsiliMatch[1]) : numbers[2],
  };
}

function calculateWeighted({ secondary = 0, qiyas = 0, tahsili = 0 }: ParsedScores) {
  if (!secondary || !qiyas || !tahsili) {
    return undefined;
  }

  return Number(((secondary * 0.3) + (qiyas * 0.3) + (tahsili * 0.4)).toFixed(2));
}

function calculateEquivalent({ secondary = 0, qiyas = 0 }: ParsedScores) {
  if (!secondary || !qiyas) {
    return undefined;
  }

  return Number(((secondary * 0.5) + (qiyas * 0.5)).toFixed(2));
}

// re-export parseGender from utils for backward compat
export { parseGender } from "@/lib/utils";
// re-export normalizeArabic for backward compat
export { normalizeArabic } from "@/lib/utils";

function parseDegree(text: string) {
  const normalized = normalizeArabic(text);
  if (normalized.includes("دبلوم")) {
    return "دبلوم";
  }
  if (normalized.includes("بكالوريوس")) {
    return "بكالوريوس";
  }
  return undefined;
}

function parseRequestedLocation(text: string) {
  const normalized = normalizeArabic(text);
  if (normalized.includes("المقر الرئيسي") || normalized.includes("المقر الرئيس")) {
    return "المقر الرئيسي";
  }
  if (normalized.includes("فرع") || normalized.includes("فروع")) {
    return "فرع";
  }

  for (const [region, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(normalizeArabic(alias)))) {
      return region;
    }
  }

  return undefined;
}

function parseRequestedCount(text: string) {
  const match = text.match(/(?:رتب|اعطني|أعطني|ابي|أبي|ابغى|اريد|أريد)?\D{0,12}(\d{1,2})\s*(?:رغبات|رغبه|رغبة|خيارات|خيار)/);
  if (!match) {
    return undefined;
  }

  const count = Number(match[1]);
  if (!Number.isFinite(count)) {
    return undefined;
  }

  return Math.min(Math.max(count, 1), 15);
}

function extractFormulaWeight(formula: string, label: string) {
  const match = formula.match(new RegExp(`(\\d+(?:\\.\\d+)?)%\\s*${label}`));
  return match ? Number(match[1]) / 100 : undefined;
}

function calculateScoreForFormula(
  formula: string,
  scores: ParsedScores,
  weighted: number | undefined,
  equivalent: number | undefined
) {
  const secondaryWeight = extractFormulaWeight(formula, "ثانوية");
  const qiyasWeight = extractFormulaWeight(formula, "قدرات");
  const tahsiliWeight = extractFormulaWeight(formula, "تحصيلي");
  const declaredWeightSum =
    (secondaryWeight ?? 0) + (qiyasWeight ?? 0) + (tahsiliWeight ?? 0);

  if (declaredWeightSum > 1.05) {
    const minimum = parseMinimumRate(formula);
    const requirementMargins = [
      typeof secondaryWeight === "number" && typeof scores.secondary === "number"
        ? scores.secondary - (secondaryWeight * 100)
        : undefined,
      typeof qiyasWeight === "number" && typeof scores.qiyas === "number"
        ? scores.qiyas - (qiyasWeight * 100)
        : undefined,
      typeof tahsiliWeight === "number" && typeof scores.tahsili === "number"
        ? scores.tahsili - (tahsiliWeight * 100)
        : undefined,
    ].filter((margin): margin is number => typeof margin === "number");

    if (typeof minimum === "number" && requirementMargins.length > 0) {
      return Number((minimum + Math.min(...requirementMargins)).toFixed(2));
    }
  }

  if (
    typeof secondaryWeight === "number" &&
    typeof qiyasWeight === "number" &&
    declaredWeightSum > 0 &&
    declaredWeightSum <= 1.05 &&
    typeof scores.secondary === "number" &&
    typeof scores.qiyas === "number" &&
    (typeof tahsiliWeight !== "number" || typeof scores.tahsili === "number")
  ) {
    return Number(
      (
        scores.secondary * secondaryWeight +
        scores.qiyas * qiyasWeight +
        (scores.tahsili ?? 0) * (tahsiliWeight ?? 0)
      ).toFixed(2)
    );
  }

  if (formula.includes("تحصيلي")) {
    return weighted;
  }

  return equivalent ?? weighted;
}

// normalizeArabic is now imported from @/lib/utils

function extractInterest(text: string) {
  const normalized = normalizeArabic(text);
  // ابحث عن أطول كلمة متطابقة (الأكثر تحديداً)
  let bestMatch: string | undefined = undefined;
  let bestMatchLength = 0;

  for (const keyword of INTEREST_KEYWORDS) {
    const normalizedKeyword = normalizeArabic(keyword);
    if (normalized.includes(normalizedKeyword) && normalizedKeyword.length > bestMatchLength) {
      bestMatch = keyword;
      bestMatchLength = normalizedKeyword.length;
    }
  }

  return bestMatch;
}

/** يجرد بادئات حروف الجر العربية المركبة (لل، بال، وال…) ثم «ال» التعريف */
function stripArabicPrefix(token: string): string {
  return token.replace(/^(?:لل|بال|وال|فال|كال|ال)/, "");
}

function tokenizeNormalized(text: string) {
  return normalizeArabic(text)
    .split(" ")
    .map(stripArabicPrefix)
    .filter((token) => token.length > 1);
}

function removeUniversityWord(text: string) {
  return normalizeArabic(text)
    .replace(/\bجامعه\b/g, " ")
    .replace(/\bالجامعه\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUniversityId(id: string | null | undefined) {
  if (id === "KSAU-HS") {
    return "KSAU_HS";
  }
  if (id === "IMU") {
    return "IMSIU";
  }
  if (id === "شروط القبول_جامعة_سطام") {
    return "PSAU";
  }
  return id ?? "";
}

function parseMinimumRate(minRate: string | number | undefined) {
  if (typeof minRate === "number") {
    return minRate;
  }

  const match = minRate?.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function isCompetitiveMinimum(minRate: string | number | undefined) {
  return Boolean(
    typeof minRate === "string" && normalizeArabic(minRate).includes("تنافسي")
  );
}

function programMatchesInterest(
  program: ProgramItem,
  interest: string | undefined,
  university?: UniversityItem
) {
  if (!interest) {
    return true;
  }

  if (["دبلوم", "بكالوريوس"].includes(interest)) {
    return true;
  }

  const programText = [university?.name, program.name, program.college, program.campus, program.city, program.track]
    .filter(Boolean)
    .join(" ");
  const normalizedText = normalizeArabic(programText);
  const normalizedInterest = normalizeArabic(interest).replace(/^ال/, "");
  const tokens = tokenizeNormalized(programText);
  const strippedText = normalizedText
    .split(" ")
    .map(stripArabicPrefix)
    .join(" ");

  if (normalizedInterest === "صناعات عسكريه") {
    return (
      normalizedText.includes("صناعات عسكريه") ||
      strippedText.includes("صناعات عسكريه") ||
      normalizedText.includes("انظمه دفاعيه") ||
      normalizedText.includes("تقنيه التصنيع") ||
      normalizedText.includes("خطوط الانتاج")
    );
  }

  if (normalizedInterest === "دفاع جوي") {
    return normalizedText.includes("دفاع جوي") || strippedText.includes("دفاع جوي");
  }

  if (normalizedInterest === "مراقبه جويه") {
    return normalizedText.includes("مراقبه جويه") || strippedText.includes("مراقبه جويه");
  }

  if (normalizedInterest === "طائره مسيره") {
    return normalizedText.includes("طائره مسيره") || strippedText.includes("طائره مسيره");
  }

  if (["انظمه التسليح", "توجيه المقاتلات"].includes(normalizedInterest)) {
    return normalizedText.includes(normalizedInterest) || strippedText.includes(normalizedInterest);
  }

  if (["عسكري", "عسكريه", "عسكر"].includes(normalizedInterest)) {
    return (
      normalizedText.includes("عسكري") ||
      normalizedText.includes("دفاع") ||
      normalizedText.includes("الحرس الوطني") ||
      normalizedText.includes("صناعات عسكريه") ||
      normalizedText.includes("انظمه دفاعيه")
    );
  }

  // مطابقة العبارات المركبة كاملاً أولاً (الأولوية للأكثر تحديداً)
  if (normalizedInterest.includes(" ")) {
    // مطابقة مباشرة أو بعد تجريد بادئات «ال» من كل كلمة في النص
    if (normalizedText.includes(normalizedInterest) || strippedText.includes(normalizedInterest)) {
      return true;
    }
    // تحقق من وجود كلمات جذرية رئيسية (أكثر من 60% من كلمات الاهتمام)
    const interestWords = normalizedInterest.split(" ").filter((w) => w.length > 2);
    const matchCount = interestWords.filter((iw) =>
      tokens.some((tk) => tk === iw || tk.startsWith(iw) || iw.startsWith(tk))
    ).length;
    return matchCount >= Math.max(1, Math.ceil(interestWords.length * 0.6));
  }

  // معالجة خاصة: الذكاء الاصطناعي
  if (["ذكاء", "اصطناعي", "صناعي", "تعلم"].includes(normalizedInterest)) {
    return (
      normalizedText.includes("ذكاء اصطناعي") ||
      normalizedText.includes("ذكاء صناعي") ||
      normalizedText.includes("تعلم الي") ||
      normalizedText.includes("علوم الذكاء")
    );
  }

  // معالجة خاصة: البيانات والتحليل والإحصاء
  if (["بيانات", "تحليل", "احصاء"].includes(normalizedInterest)) {
    return (
      normalizedText.includes("بيانات") ||
      normalizedText.includes("تحليل") ||
      normalizedText.includes("احصاء") ||
      normalizedText.includes("داتا")
    );
  }

  // معالجة خاصة: الطب (كلمة مفردة فقط)
  if (normalizedInterest === "طب") {
    return tokens.some((token) => token === "طب");
  }

  // مطابقة الكلمات المفردة
  return tokens.some(
    (token) =>
      token === normalizedInterest ||
      (normalizedInterest.length >= 3 && token.startsWith(normalizedInterest))
  );
}

/** تحديد إذا كان البرنامج مفتوحاً للجنس المطلوب بناءً على قيمة gender الخام */
function programMatchesGender(program: ProgramItem, requestedGender: "male" | "female" | undefined) {
  if (!requestedGender) {
    return true;
  }

  const rawGender = (program.gender ?? "").trim();
  // إذا كان الحقل فارغاً أو غير محدد = متاح للجميع
  if (!rawGender || rawGender === "غير محدد") {
    return true;
  }

  // التطبيع: إزالة التشكيل فقط، مع الإبقاء على الأحرف العربية
  const g = rawGender
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآ]/g, "ا");

  // برامج مخصصة للطلاب فقط (يجب حذفها عند female)
  const maleOnly =
    /طلاب\s*فقط/.test(g) ||
    /\(طلاب\)/.test(g) ||
    /للطلاب\b/.test(g) ||
    /^الطلاب$/.test(g.trim()) ||
    (g.includes("طلاب") && !g.includes("طالبات"));

  // برامج مخصصة للطالبات فقط
  const femaleOnly =
    /طالبات\s*فقط/.test(g) ||
    /\(طالبات\)/.test(g) ||
    /للطالبات\b/.test(g) ||
    /^الطالبات$/.test(g.trim()) ||
    (g.includes("طالبات") && !g.includes("طلاب"));

  // برامج مشتركة (طلاب وطالبات بأي صيغة)
  const mixed = g.includes("طلاب") && g.includes("طالبات");

  if (requestedGender === "female") {
    if (maleOnly) return false;
    if (femaleOnly || mixed) return true;
    // لا طلاب ولا طالبات صريحة — اعتبرها متاحة
    return true;
  }

  // male
  if (femaleOnly) return false;
  if (maleOnly || mixed) return true;
  return true;
}

function programMatchesDegree(program: ProgramItem, requestedDegree: string | undefined) {
  if (!requestedDegree) {
    return true;
  }

  return normalizeArabic(program.degree ?? "").includes(normalizeArabic(requestedDegree));
}

function programMatchesLocation(
  program: ProgramItem,
  university: UniversityItem,
  requestedLocation: string | undefined
) {
  if (!requestedLocation) {
    return true;
  }

  const requested = normalizeArabic(requestedLocation);
  const haystack = normalizeArabic(
    [
      program.campus,
      program.campus_type,
      program.city,
      program.region,
      university.city,
      university.region,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (requested === normalizeArabic("فرع")) {
    return haystack.includes("فرع") || normalizeArabic(program.campus_type ?? "").includes("فرع");
  }

  return haystack.includes(requested);
}

function chanceLabel(score: number | undefined, minimum: number | undefined) {
  if (!score || !minimum) {
    return "غير محددة";
  }

  const diff = score - minimum;
  if (diff >= 5) {
    return "مرتفعة";
  }
  if (diff >= 0) {
    return "متوسطة";
  }
  return "منخفضة";
}

function unknownMinimumFitScore(program: ProgramItem, score: number | undefined, interest: string | undefined) {
  if (typeof score !== "number") {
    return -999;
  }

  const normalizedText = normalizeArabic(
    [program.name, program.college, program.campus, program.city, program.track, program.degree]
      .filter(Boolean)
      .join(" ")
  );
  const tokens = tokenizeNormalized(normalizedText);
  const hasAnyToken = (needles: string[]) =>
    tokens.some((token) => needles.some((needle) => token === needle || token.startsWith(needle)));
  let fitScore = score - 90;

  if (normalizeArabic(program.degree ?? "").includes("دبلوم")) {
    fitScore += 28;
  }

  if (/اداري|اداره|اعمال|محاسب|تسويق|لوجستي|سياح|فندقي|انساني|ادبي|نظري|شريعه|انظمه|قانون|لغه|اعلام|خدمه اجتماعيه|تاريخ|دعوه|عقيده/.test(normalizedText)) {
    fitScore += 16;
  }

  if (hasAnyToken(["حاسب", "برمج", "بيانات", "ذكاء", "سيبراني", "معلومات", "تقنيه"])) {
    fitScore += 4;
  }

  if (hasAnyToken(["هندس", "عماره", "تخطيط", "ميكاترونكس", "كهرب", "ميكانيك", "مدني", "صناعي", "تشييد"])) {
    fitScore -= 20;
  }

  if (hasAnyToken(["طب", "جراح", "اسنان", "صيدل", "تمريض", "قباله", "مختبر", "علاج", "اشعه", "تنفسي", "صحي", "صحه", "وبائ", "تغذيه", "بصريات", "طوارئ"])) {
    fitScore -= 42;
  }

  if (interest) {
    fitScore += 18;
  }

  return fitScore;
}

type RankedProgramRow = {
  university: string;
  program: ProgramItem;
  score?: number;
  minimum?: number;
  diff?: number;
  rankScore: number;
};

function extractKnowledgeExcerpt(content: string | undefined, query: string, maxChars = 2400) {
  if (!content?.trim()) {
    return "";
  }

  const queryTokens = normalizeArabic(query)
    .split(" ")
    .filter((token) => token.length > 2);
  const lines = content.split(/\r?\n/);
  const picked: string[] = [];
  const seen = new Set<string>();
  let totalChars = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (line.length < 4 || line.length > 240) {
      continue;
    }

    const normalizedLine = normalizeArabic(line);
    const hasQueryToken = queryTokens.some((token) => normalizedLine.includes(token));
    const hasSignal = SIGNAL_LINE_REGEX.test(line);

    if (!hasQueryToken && !hasSignal) {
      continue;
    }
    if (seen.has(line)) {
      continue;
    }
    if (totalChars + line.length + 1 > maxChars) {
      break;
    }

    picked.push(line);
    seen.add(line);
    totalChars += line.length + 1;
  }

  return (picked.length > 0 ? picked.join("\n") : content.slice(0, maxChars)).trim();
}

function buildUniversityContexts(query: string, mentionedUniversities: UniversityItem[]) {
  if (mentionedUniversities.length === 0) {
    return [];
  }

  return mentionedUniversities
    .map((university) => {
      const excerpt = extractKnowledgeExcerpt(university.knowledge_text, query);
      if (!excerpt) {
        return undefined;
      }

      return {
        university: university.name,
        source:
          university.knowledge_source_txt ??
          university.source_file ??
          getPrimaryDataSourceName(),
        excerpt,
      };
    })
    .filter((context): context is NonNullable<typeof context> => Boolean(context));
}

function rankPrograms(
  query: string,
  scores: ParsedScores,
  weighted: number | undefined,
  equivalent: number | undefined,
  mentionedUniversities: UniversityItem[],
  filters: {
    requestedGender?: "male" | "female";
    requestedDegree?: string;
    requestedLocation?: string;
    requestedCount?: number;
  } = {},
  allUniversitiesData?: UniversityItem[]
) {
  const interest = extractInterest(query);
  const mentionedNames = new Set(mentionedUniversities.map((university) => university.name));
  const universities = mentionedNames.size > 0
    ? (allUniversitiesData || (UNIVERSITIES_DATA as UniversityItem[])).filter(
      (university) => mentionedNames.has(university.name)
    )
    : (allUniversitiesData || (UNIVERSITIES_DATA as UniversityItem[]));

  const rows: RankedProgramRow[] = universities.flatMap((university) =>
    (university.programs ?? [])
      .filter((program) => programMatchesInterest(program, interest, university))
      .filter((program) => programMatchesGender(program, filters.requestedGender))
      .filter((program) => programMatchesDegree(program, filters.requestedDegree))
      .filter((program) => programMatchesLocation(program, university, filters.requestedLocation))
      .map((program) => {
        const formula = program.formula ?? "";
        const score = calculateScoreForFormula(formula, scores, weighted, equivalent);
        const minimum = parseMinimumRate(program.min_rate);
        const competitive = isCompetitiveMinimum(program.min_rate);
        const diff =
          typeof score === "number" && typeof minimum === "number"
            ? score - minimum
            : undefined;

        const chance = chanceLabel(score, minimum);
        const opportunityBoost =
          chance === "مرتفعة" ? 20 :
            chance === "متوسطة" ? 10 :
              0;

        return {
          university: university.name,
          program,
          score,
          minimum,
          diff,
          rankScore:
            typeof diff === "number"
              ? diff + opportunityBoost + (typeof score === "number" ? score / 100 : 0)
              : competitive && typeof score === "number"
                ? score - 75 + opportunityBoost
                : unknownMinimumFitScore(program, score, interest) + opportunityBoost,
        };
      })
  );

  const sortedRows = rows.sort((a, b) => b.rankScore - a.rankScore);
  const limit = filters.requestedCount ?? 5;

  if (mentionedNames.size === 1) {
    return sortedRows.slice(0, limit);
  }

  const selected: RankedProgramRow[] = [];
  const usedUniversities = new Set<string>();

  for (const row of sortedRows) {
    if (usedUniversities.has(row.university)) {
      continue;
    }

    selected.push(row);
    usedUniversities.add(row.university);

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const row of sortedRows) {
    if (selected.includes(row)) {
      continue;
    }

    selected.push(row);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function buildMentionedUniversityFallbackRows(
  mentionedUniversities: UniversityItem[],
  query: string,
  scores: ParsedScores,
  weighted: number | undefined,
  equivalent: number | undefined,
  filters: {
    requestedGender?: "male" | "female";
    requestedDegree?: string;
    requestedLocation?: string;
    requestedCount?: number;
  }
): RankedProgramRow[] {
  const interest = extractInterest(query);
  const fallbackRows: RankedProgramRow[] = [];
  const requestedLimit = filters.requestedCount ?? 5;
  const perUniversityLimit = Math.max(
    1,
    Math.ceil(requestedLimit / Math.max(1, mentionedUniversities.length))
  );

  for (const university of mentionedUniversities) {
    const programs = university.programs ?? [];
    const matchingPrograms = programs.filter((program) =>
      programMatchesInterest(program, interest, university) &&
      programMatchesGender(program, filters.requestedGender) &&
      programMatchesDegree(program, filters.requestedDegree) &&
      programMatchesLocation(program, university, filters.requestedLocation)
    );
    const candidates = matchingPrograms.length > 0 ? matchingPrograms : programs;
    const candidateRows = candidates.map((candidate) => {
      const formula = candidate.formula ?? "";
      const score = calculateScoreForFormula(formula, scores, weighted, equivalent);
      const minimum = parseMinimumRate(candidate.min_rate);
      const competitive = isCompetitiveMinimum(candidate.min_rate);
      const diff =
        typeof score === "number" && typeof minimum === "number"
          ? score - minimum
          : undefined;

      const chance = chanceLabel(score, minimum);
      const opportunityBoost =
        chance === "مرتفعة" ? 20 :
          chance === "متوسطة" ? 10 :
            0;

      return {
        university: university.name,
        program: candidate,
        score,
        minimum,
        diff,
        rankScore:
          typeof diff === "number"
            ? diff + 100 + opportunityBoost + (typeof score === "number" ? score / 100 : 0)
            : competitive && typeof score === "number"
              ? score - 75 + 100 + opportunityBoost
              : unknownMinimumFitScore(candidate, score, interest) + 100 + opportunityBoost,
      };
    });

    fallbackRows.push(
      ...candidateRows
        .sort((a, b) => b.rankScore - a.rankScore)
        .slice(0, perUniversityLimit)
    );
  }

  return fallbackRows.sort((a, b) => b.rankScore - a.rankScore).slice(0, requestedLimit);
}

export function buildAdvisorSummary(
  messages: ChatMessage[],
  profile?: UserProfile,
  allUniversitiesData?: UniversityItem[]
): AdvisorSummary {
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const scores = parseScores(latestUserMessage);
  const weighted = calculateWeighted(scores);
  const equivalent = calculateEquivalent(scores);
  const requestedGender = parseGender(latestUserMessage, profile?.gender);
  const requestedDegree = parseDegree(latestUserMessage);
  const requestedLocation = parseRequestedLocation(latestUserMessage);
  const requestedCount = parseRequestedCount(latestUserMessage);

  const searchData = allUniversitiesData || getUniversitiesData();
  const findMentionedInCustom = (query: string) => {
    const normalizedQuery = normalizeArabic(query);
    const queryWithoutUniversity = removeUniversityWord(query);

    return searchData.filter((university) => {
      const normalizedName = normalizeArabic(university.name);
      const nameWithoutUniversity = removeUniversityWord(university.name);
      const aliases = UNIVERSITY_ALIASES[normalizeUniversityId(university.id)] ?? [];
      const hasAlias = aliases.some((alias) => {
        const normalizedAlias = normalizeArabic(alias);
        const aliasWithoutUniversity = removeUniversityWord(alias);

        return (
          normalizedQuery.includes(normalizedAlias) ||
          (aliasWithoutUniversity.length >= 3 &&
            queryWithoutUniversity.includes(aliasWithoutUniversity))
        );
      });

      return (
        hasAlias ||
        normalizedQuery.includes(normalizedName) ||
        (nameWithoutUniversity.length >= 3 &&
          queryWithoutUniversity.includes(nameWithoutUniversity))
      );
    });
  };

  const mentionedUniversities = findMentionedInCustom(latestUserMessage);
  const mentionedUniversity =
    mentionedUniversities.length === 1 ? mentionedUniversities[0] : undefined;
  const requestLines = latestUserMessage
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const universityLines = requestLines
    .map((line) => ({
      line,
      universities: findMentionedInCustom(line),
    }))
    .filter((item) => item.universities.length > 0);
  const rankedBase =
    universityLines.length > 1
      ? universityLines.flatMap(({ line, universities }) => {
        const lineScores = parseScores(line);
        return rankPrograms(
          line,
          lineScores,
          calculateWeighted(lineScores),
          calculateEquivalent(lineScores),
          universities,
          { requestedGender, requestedDegree, requestedLocation, requestedCount },
          searchData
        ).slice(0, requestedCount ?? 5);
      })
      : rankPrograms(
        latestUserMessage,
        scores,
        weighted,
        equivalent,
        mentionedUniversities,
        { requestedGender, requestedDegree, requestedLocation, requestedCount },
        searchData
      );

  const explicitFallbackRows = mentionedUniversities.length > 0
    ? buildMentionedUniversityFallbackRows(
      mentionedUniversities,
      latestUserMessage,
      scores,
      weighted,
      equivalent,
      { requestedGender, requestedDegree, requestedLocation, requestedCount }
    )
    : [];

  const scopedRankedBase = mentionedUniversities.length > 0
    ? rankedBase.filter((row) =>
      mentionedUniversities.some((university) => university.name === row.university)
    )
    : rankedBase;
  const ranked = [...explicitFallbackRows, ...scopedRankedBase.filter((row) => !explicitFallbackRows.some((fallback) => fallback.university === row.university))]
    .slice(0, requestedCount ?? 5);
  const universityContexts = buildUniversityContexts(latestUserMessage, mentionedUniversities);
  const structuredUniversityNames = searchData
    .filter((university) => (university.programs ?? []).length > 0)
    .map((university) => university.name);

  const recommendations = ranked.map(({ university, program, score, minimum, diff }) => {
    const chance = chanceLabel(score, minimum);
    const universityItem = searchData.find(
      (item) => item.name === university
    );
    return {
      university,
      programName: program.name ?? program.college ?? "برنامج غير محدد",
      college: program.college,
      degree: program.degree,
      campus: program.campus,
      campusType: program.campus_type,
      city: program.city ?? universityItem?.city,
      region: program.region ?? universityItem?.region,
      track: program.track,
      minimumText: program.min_rate ?? "غير محدد",
      formulaText: program.formula ?? "غير محددة",
      gender: program.gender,
      calculatedScore: score,
      minimum,
      chance,
      diff: typeof diff === "number" ? Number(diff.toFixed(2)) : undefined,
      requirements: (universityItem?.requirements ?? []).slice(0, 3),
    };
  });

  return {
    latestUserMessage,
    mentionedUniversity: mentionedUniversity?.name,
    mentionedUniversities: mentionedUniversities.map((university) => university.name),
    scores,
    weighted,
    equivalent,
    requestedGender,
    requestedDegree,
    requestedLocation,
    requestedCount,
    recommendations,
    dataCoverage: {
      totalUniversities: searchData.length,
      structuredUniversities: structuredUniversityNames.length,
      structuredUniversityNames,
      isComplete:
        structuredUniversityNames.length ===
        searchData.length,
    },
    universityContexts,
  };
}

export function buildLocalAdvisorReply(
  messages: ChatMessage[],
  reason?: string,
  profile?: UserProfile,
  allUniversitiesData?: UniversityItem[]
) {
  const summary = buildAdvisorSummary(messages, profile, allUniversitiesData);

  const { weighted, equivalent, recommendations } = summary;

  const scoreLines = [
    weighted ? `- النسبة الموزونة التقريبية: ${weighted}%` : undefined,
    equivalent ? `- النسبة المكافئة التقريبية: ${equivalent}%` : undefined,
    summary.requestedGender
      ? `- الفئة: ${summary.requestedGender === "female" ? "طالبة" : "طالب"}`
      : undefined,
    summary.requestedDegree ? `- الدرجة المطلوبة: ${summary.requestedDegree}` : undefined,
    summary.requestedLocation ? `- نطاق الموقع المطلوب: ${summary.requestedLocation}` : undefined,
    summary.requestedCount ? `- عدد الرغبات المطلوب: ${summary.requestedCount}` : undefined,
  ].filter(Boolean);

  const recommendationLines = recommendations.map((recommendation) =>
    `- ${recommendation.university}: ${recommendation.programName} (${recommendation.degree ?? "درجة غير محددة"}، ${recommendation.gender ?? "فئة غير محددة"})، ${recommendation.campus && recommendation.campus !== "غير محدد" ? `المقر: ${recommendation.campus}، ` : ""}الحد/المعيار: ${recommendation.minimumText}، فرصتك: ${recommendation.chance}، المعادلة: ${recommendation.formulaText}`
  );
  const hasKnownChance = recommendations.some(
    (recommendation) => recommendation.chance !== "غير محددة"
  );
  const hasHighChance = recommendations.some(
    (recommendation) => recommendation.chance === "مرتفعة"
  );
  const hasMediumChance = recommendations.some(
    (recommendation) => recommendation.chance === "متوسطة"
  );
  const advice = hasHighChance
    ? "نصيحتي: ابدأ بالخيارات ذات الفرصة المرتفعة، ثم أضف خيارين متوسطين كخطة احتياطية. تأكد من الجنس والمسار وشروط الجامعة وقت التقديم لأن بعض التفاصيل تتغير سنوياً."
    : hasMediumChance
      ? "نصيحتي: ابدأ بالخيارات المتوسطة كخطة قابلة للمراجعة، وأضف خيارات أكثر أماناً إن توفرت. تأكد من الجنس والمسار وشروط الجامعة وقت التقديم لأن بعض التفاصيل تتغير سنوياً."
      : hasKnownChance
        ? "نصيحتي: النتائج الحالية منخفضة حسب الحدود الرقمية المتوفرة، فاجعلها رغبات طموح وأضف خيارات أكثر أماناً."
        : "نصيحتي: لأن الحد المذكور تنافسي أو غير محدد رقمياً، استخدم هذه الخيارات كقائمة مناسبة مبدئياً، ثم راجع شروط الجامعة والمقاعد المتاحة وقت التقديم.";

  if (recommendations.length === 0 && summary.universityContexts.length > 0) {
    const context = summary.universityContexts[0];
    return [
      `بخصوص ${context.university}: البيانات المهيكلة للتخصصات غير مكتملة حالياً، لكن يوجد نص قبول مستخرج من ملف ${context.source}.`,
      "",
      "أبرز ما ظهر في النص:",
      context.excerpt,
      "",
      "نصيحتي: استخدم هذه المعلومات كإرشاد أولي، وتحقق من صفحة الجامعة أو منصة القبول وقت التقديم لأن تفاصيل المقاعد والشروط قد تتغير.",
    ].join("\n");
  }

  if (recommendations.length === 0) {
    const hasScores =
      summary.scores.secondary !== undefined ||
      summary.scores.qiyas !== undefined;
    if (hasScores) {
      const weighted = summary.weighted ? ` (النسبة الموزونة التقريبية: ${summary.weighted}%)` : "";
      return [
        `لم أجد برامج مطابقة لدرجاتك${weighted} في قاعدة بياناتنا الحالية.`,
        "",
        "قد يكون السبب:",
        "- درجاتك أقل من الحد الأدنى المطلوب للتخصص المذكور.",
        "- التخصص غير متوفر في الجامعات المشمولة بالبيانات حالياً.",
        "",
        "جرّب تخصصاً آخر أو اسأل عن جامعة معينة للحصول على تفاصيل شروط القبول.",
      ].join("\n");
    }
    return "أقدر أساعدك، لكن احتجت تفاصيل أكثر مثل: نسبة الثانوية، القدرات، التحصيلي، والتخصص المطلوب.\n\nمثال: نسبتي 88، قدراتي 76، تحصيلي 82، أريد هندسة.";
  }

  return [
    "بناءً على بيانات القبول المتوفرة:",
    "",
    ...scoreLines,
    "",
    "أفضل الخيارات المطابقة:",
    ...recommendationLines,
    "",
    advice,
  ].join("\n");
}
