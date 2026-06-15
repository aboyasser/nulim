import {
  getKnowledgeData,
  getSupplementalKnowledgeData,
  type UniversityItem,
} from "@/lib/data-source";
import { normalizeArabic } from "@/lib/utils";

type IndexedKnowledgeItem = {
  id?: string | null;
  name: string;
  source: string;
  content: string;
  normalizedName: string;
  normalizedContent: string;
};

type BuildKnowledgeContextOptions = {
  maxDocs?: number;
  maxCharsPerDoc?: number;
};

type BuildKnowledgeContextResult = {
  context: string;
  matchedSources: string[];
};

const STOP_WORDS = new Set([
  "انا",
  "أنا",
  "أريد",
  "اريد",
  "ابغى",
  "ابي",
  "بغيت",
  "جامعة",
  "الجامعة",
  "جامعه",
  "الجامعه",
  "قبول",
  "القبول",
  "نسبة",
  "النسبة",
  "الموزونة",
  "المكافئة",
  "ثانوية",
  "الثانوية",
  "قدرات",
  "تحصيلي",
  "الى",
  "إلى",
  "في",
  "من",
  "على",
  "عن",
  "مع",
  "هل",
  "ما",
  "كيف",
  "كم",
]);

const SIGNAL_LINE_REGEX =
  /(النسبة|الموزونة|المكافئة|ثانوية|قدرات|تحصيلي|قبول|تخصص|تخصصات|كلية|المسار|طلاب|طالبات|ذكور|إناث|اناث|طب|هندسة)/i;

// normalizeArabic is imported from @/lib/utils

function tokenizeQuery(query: string): string[] {
  const tokens = normalizeArabic(query)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return [...new Set(tokens)];
}

function scoreDoc(doc: IndexedKnowledgeItem, tokens: string[]): number {
  let score = 0;

  for (const token of tokens) {
    if (doc.normalizedName.includes(token)) {
      score += 6;
    }
    if (doc.normalizedContent.includes(token)) {
      score += token.length >= 4 ? 3 : 2;
    }
  }

  return score;
}

function extractSignalLines(
  content: string,
  tokens: string[],
  maxChars: number
): string {
  const lines = content.split(/\r?\n/);
  const picked: string[] = [];
  const seen = new Set<string>();
  let totalChars = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (line.length < 4 || line.length > 220) {
      continue;
    }

    const normalizedLine = normalizeArabic(line);
    const hasToken = tokens.some((token) => normalizedLine.includes(token));
    const hasSignal = SIGNAL_LINE_REGEX.test(line);
    if (!hasToken && !hasSignal) {
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

  if (picked.length > 0) {
    return picked.join("\n");
  }

  return content.slice(0, maxChars).trim();
}

function buildIndexedKnowledge(data: UniversityItem[]): IndexedKnowledgeItem[] {
  return data
    .map((item) => {
      const programSummary = (item.programs ?? [])
        .map((program) =>
          [
            program.name,
            program.college,
            program.min_rate,
            program.formula,
            program.gender,
            program.degree,
            program.campus,
            program.city,
            program.region,
            program.track,
          ]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n");

      const content = [item.knowledge_text, programSummary]
        .filter((part) => typeof part === "string" && part.trim().length > 0)
        .join("\n");

      const source = item.knowledge_source_txt ?? item.source_file ?? "structured-data";

      return {
        id: item.id,
        name: item.name,
        source,
        content,
      };
    })
    .filter((item) => item.content.trim().length > 0)
    .map((item) => ({
      ...item,
      normalizedName: normalizeArabic(item.name ?? ""),
      normalizedContent: normalizeArabic(item.content ?? ""),
    }));
}

// Module-level cache for the default knowledge index (built once)
let _cachedDefaultIndex: IndexedKnowledgeItem[] | null = null;

function getDefaultKnowledgeIndex(): IndexedKnowledgeItem[] {
  if (!_cachedDefaultIndex) {
    _cachedDefaultIndex = buildIndexedKnowledge(getKnowledgeData());
  }
  return _cachedDefaultIndex;
}

export function buildKnowledgeContext(
  userQuery: string,
  options: BuildKnowledgeContextOptions = {},
  allUniversitiesData?: UniversityItem[]
): BuildKnowledgeContextResult {
  const maxDocs = options.maxDocs ?? 3;
  const maxCharsPerDoc = options.maxCharsPerDoc ?? 2200;
  const tokens = tokenizeQuery(userQuery);

  const knowledgeIndex = allUniversitiesData
    ? buildIndexedKnowledge([...allUniversitiesData, ...getSupplementalKnowledgeData()])
    : getDefaultKnowledgeIndex();

  if (tokens.length === 0 || knowledgeIndex.length === 0) {
    return { context: "", matchedSources: [] };
  }

  const ranked = knowledgeIndex
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return { context: "", matchedSources: [] };
  }

  const selected = ranked.slice(0, maxDocs);
  const blocks = selected.map(({ doc }) => {
    const excerpt = extractSignalLines(doc.content, tokens, maxCharsPerDoc);
    return `[المصدر: ${doc.name} | ${doc.source}]\n${excerpt}`;
  });

  return {
    context: blocks.join("\n\n"),
    matchedSources: selected.map(({ doc }) => doc.source),
  };
}
