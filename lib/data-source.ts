import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import fallbackUniversitiesDataRaw from "../data/النتائج.json";

export type ProgramItem = {
  name?: string;
  college?: string;
  min_rate?: string | number;
  formula?: string;
  gender?: string;
  degree?: string;
  campus?: string;
  campus_type?: string;
  city?: string;
  region?: string;
  track?: string;
  source_excerpt?: string;
};

export type UniversityItem = {
  id?: string | null;
  name: string;
  city?: string;
  region?: string;
  source_file?: string;
  source_docx?: string;
  knowledge_source_txt?: string;
  programs?: ProgramItem[];
  knowledge_text?: string;
  requirements?: string[];
};

function inferRegion(city: string | undefined): string | undefined {
  if (!city) return undefined;
  const normalized = city.trim();
  if (["الرياض", "المجمعة", "الخرج", "الدرعية", "بريدة", "شقراء", "القصيم", "الزلفي", "القويعية"].some(c => normalized.includes(c))) {
    return "المنطقة الوسطى";
  }
  if (["مكة", "جدة", "الطائف", "رابغ", "القنفذة"].some(c => normalized.includes(c))) {
    return "منطقة مكة المكرمة";
  }
  if (["الدمام", "الخبر", "الأحساء", "الاحساء", "حفر الباطن", "الجبيل"].some(c => normalized.includes(c))) {
    return "المنطقة الشرقية";
  }
  if (["تبوك", "الجوف", "عرعر", "رفحاء", "طريف", "حائل", "سكاكا", "القريات"].some(c => normalized.includes(c))) {
    return "المنطقة الشمالية";
  }
  if (["أبها", "ابها", "الباحة", "بيشة", "عسير", "نجران", "خميس مشيط", "جازان", "شرورة"].some(c => normalized.includes(c))) {
    return "المنطقة الجنوبية";
  }
  return undefined;
}

interface RawProgramItem {
  name?: string;
  college?: string;
  gender?: string;
  degree?: string;
  track?: string;
  city_or_campus?: string;
  admission_criteria?: {
    score_type?: string;
    min_score_limit?: string | number | null;
    formula_details?: string;
  };
  additional_conditions?: string | null;
}

interface RawUniversityItem {
  university_info?: {
    id?: string;
    name?: string;
    city_or_branch?: string;
    region?: string;
  };
  programs?: RawProgramItem[];
  knowledge_text?: string;
  additional_conditions?: string;
}

const fallbackUniversitiesData: UniversityItem[] = (fallbackUniversitiesDataRaw as unknown as RawUniversityItem[]).map((item) => {
  const info = item.university_info || {};
  const rawPrograms = item.programs || [];
  const uniCity = info.city_or_branch;
  const uniRegion = inferRegion(uniCity);

  const programs: ProgramItem[] = rawPrograms.map((p: RawProgramItem) => {
    const criteria = p.admission_criteria || {};

    // Normalize gender: both -> طلاب وطالبات, female -> طالبات, male -> طلاب
    let gender = p.gender;
    if (gender === "both") {
      gender = "طلاب وطالبات";
    } else if (gender === "female") {
      gender = "طالبات";
    } else if (gender === "male") {
      gender = "طلاب";
    }

    // Infer degree
    let degree = p.degree;
    if (!degree) {
      const collegeName = p.college || "";
      const progName = p.name || "";
      if (collegeName.includes("التطبيقية") || collegeName.includes("المجتمع") || progName.includes("دبلوم")) {
        degree = "دبلوم";
      } else {
        degree = "بكالوريوس";
      }
    }

    // Infer track
    let track = p.track;
    if (!track) {
      const collegeName = p.college || "";
      const progName = p.name || "";
      const text = `${collegeName} ${progName}`;
      if (
        /طب|صيدل|تمريض|هندس|حاسب|علوم|رياضيات|فيزياء|كيمياء|احياء|تقني/i.test(text)
      ) {
        track = "علمي";
      } else {
        track = "نظري";
      }
    }

    const progCity = p.city_or_campus || uniCity;

    return {
      name: p.name,
      college: p.college,
      min_rate: criteria.min_score_limit ?? "غير محدد",
      formula: criteria.formula_details ?? "غير محددة",
      gender: gender,
      degree: degree,
      campus: p.city_or_campus,
      campus_type: p.city_or_campus === uniCity ? "مقر رئيسي" : "فرع",
      city: progCity,
      region: inferRegion(progCity) || uniRegion,
      track: track,
      source_excerpt: p.additional_conditions || undefined
    };
  });

  return {
    id: info.id || null,
    name: info.name || "",
    city: uniCity,
    region: uniRegion,
    programs: programs,
    knowledge_text: item.knowledge_text || "",
    requirements: item.additional_conditions ? [item.additional_conditions] : []
  };
});

const TRAINED_DATA_PATHS = [
  path.join(process.cwd(), "trainedData.md"),
  path.join(process.cwd(), "..", "trainedData.md"),
];
const STRUCTURED_SOURCE = "public/data/final_output.json";

function findFinalOutputPath() {
  const candidates = [
    path.join(process.cwd(), "public", "data", "final_output.json"),
    path.join(process.cwd(), "..", "public", "data", "final_output.json"),
    path.join(process.cwd(), "nulim", "public", "data", "final_output.json"),
  ];

  return candidates.find((candidatePath) => existsSync(candidatePath));
}

function findTrainedDataPath() {
  return TRAINED_DATA_PATHS.find((candidatePath) => existsSync(candidatePath));
}

function readTrainedDataMarkdown() {
  const trainedDataPath = findTrainedDataPath();
  if (!trainedDataPath) {
    return { markdown: "", sourcePath: undefined };
  }

  return {
    markdown: readFileSync(trainedDataPath, "utf8").trim(),
    sourcePath: path.relative(process.cwd(), trainedDataPath),
  };
}

interface FinalOutputUniversity {
  id?: string | null;
  name?: string;
  city?: string;
  programs?: Array<{
    name?: string;
    college?: string;
    min_rate?: string | number;
    formula?: string;
    gender?: string;
    degree?: string;
    location?: string;
    campus?: string;
    track?: string;
    source_excerpt?: string;
  }>;
  knowledge_text?: string;
  requirements?: string[];
}

export function getUniversitiesData(): UniversityItem[] {
  const finalOutputPath = findFinalOutputPath();

  if (finalOutputPath) {
    try {
      const raw = JSON.parse(readFileSync(finalOutputPath, "utf8")) as FinalOutputUniversity[];
      const transformed: UniversityItem[] = raw.map((u) => {
        const uniCity = u.city || undefined;
        const programs = (u.programs || []).map((p) => ({
          name: p.name,
          college: p.college,
          min_rate: p.min_rate ?? "غير محدد",
          formula: p.formula ?? "غير محددة",
          gender: p.gender,
          degree: p.degree,
          campus: p.location || p.campus,
          campus_type: (p.location || p.campus) === uniCity ? "مقر رئيسي" : "فرع",
          city: p.location || uniCity,
          region: inferRegion(p.location) || inferRegion(uniCity),
          track: p.track,
          source_excerpt: p.source_excerpt || undefined,
        }));

        return {
          id: u.id || null,
          name: u.name || "",
          city: uniCity,
          region: inferRegion(uniCity),
          programs,
          knowledge_text: u.knowledge_text || "",
          requirements: u.requirements || [],
        } as UniversityItem;
      });

      return transformed;
    } catch {
      // If the final output file is unreadable or malformed, fall back to the embedded dataset.
    }
  }

  return fallbackUniversitiesData as UniversityItem[];
}

function parseTrainedDataRules(markdown: string, sourcePath = "trainedData.md"): UniversityItem[] {
  if (!markdown) {
    return [];
  }

  const blocks = markdown
    .split(/\n(?=###\s+قاعدة\s+\d+\s*:?\s*)/g)
    .map((block) => block.trim())
    .filter((block) => block.startsWith("###"));

  return blocks
    .map((block, index) => {
      const heading = block.match(/^###\s+(.+?)\s*$/m)?.[1]?.trim();
      const question = block.match(/\*\*السؤال:\*\*\s*([^\n]+)/)?.[1]?.trim();

      return {
        id: `trained-rule-${index + 1}`,
        name: question ? `${heading}: ${question}` : heading ?? `قاعدة ${index + 1}`,
        source_file: sourcePath,
        knowledge_source_txt: sourcePath,
        knowledge_text: block,
        programs: [],
      };
    })
    .filter((item) => item.knowledge_text.length > 0);
}

export function getSupplementalKnowledgeData(): UniversityItem[] {
  const { markdown, sourcePath } = readTrainedDataMarkdown();
  return parseTrainedDataRules(markdown, sourcePath);
}

export function getKnowledgeData(): UniversityItem[] {
  return [...getUniversitiesData(), ...getSupplementalKnowledgeData()];
}

export function getPrimaryDataSourceName() {
  return STRUCTURED_SOURCE;
}

export function getKnowledgeSourceNames() {
  const trainedDataPath = findTrainedDataPath();
  return [
    STRUCTURED_SOURCE,
    ...(trainedDataPath ? [path.relative(process.cwd(), trainedDataPath)] : []),
  ];
}
