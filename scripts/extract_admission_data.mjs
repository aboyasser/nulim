#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(appRoot, "..");
const pdfDir = path.join(projectRoot, "pdfs");
const txtDir = path.join(projectRoot, "txt");
const dataDir = path.join(appRoot, "data");
const reportPath = path.join(dataDir, "extraction_report.json");
const outputPath = path.join(dataDir, "universities_clean.json");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv(path.join(appRoot, ".env.local"));

const PDF_SOURCES = [
  { id: "MOD", name: "الكليات العسكرية - وزارة الدفاع", pdf: "- القبول الموحد للكليات العسكرية - وزارة الدفاع.pdf", txt: "وزارة_الدفاع.txt" },
  { id: "UT", name: "جامعة الطائف", pdf: "__دليل القبول جامعة الطائف ( ١٤٤٦ هـ )_.pdf", txt: "الطائف.txt" },
  { id: "PSAU", name: "جامعة الأمير سطام بن عبدالعزيز", pdf: "الأمير_سطام.pdf", txt: "الأمير_سطام.txt" },
  { id: "PNU", name: "جامعة الأميرة نورة بنت عبدالرحمن", pdf: "الأميرة_نورة.pdf", txt: "جامعة_الأميرة_نورة.txt" },
  { id: "BU", name: "جامعة الباحة", pdf: "الباحة.pdf", txt: "الباحة.txt" },
  { id: "IU", name: "الجامعة الإسلامية بالمدينة المنورة", pdf: "الجامعة الإسلامية بالمدينة المنورة.pdf", txt: "الجامعة الإسلامية بالمدينة المنورة.txt" },
  { id: "SEU", name: "الجامعة السعودية الإلكترونية", pdf: "الجامعة_السعودية_الالكترونية.pdf", txt: "الجامعة_الالكترونية.txt" },
  { id: "UJ", name: "جامعة الجوف", pdf: "الجوف.pdf", txt: "الجوف.txt" },
  { id: "QU", name: "جامعة القصيم", pdf: "القصيم.pdf", txt: "جامعة_القصيم.txt" },
  { id: "MU", name: "جامعة المجمعة", pdf: "المجمعة.pdf", txt: "المجمعة.txt" },
  { id: "KKU", name: "جامعة الملك خالد", pdf: "الملك_خالد.pdf", txt: "الملك_خالد.txt" },
  { id: "KSU", name: "جامعة الملك سعود", pdf: "الملك_سعود.pdf", txt: "الملك سعود.txt" },
  { id: "KAU", name: "جامعة الملك عبدالعزيز", pdf: "الملك_عبدالعزيز.pdf", txt: "الملك_عبدالعزيز.txt" },
  { id: "KFUPM", name: "جامعة الملك فهد للبترول والمعادن", pdf: "الملك_فهد.pdf", txt: "الملك_فهد.txt" },
  { id: "KFU", name: "جامعة الملك فيصل", pdf: "الملك_فيصل.pdf", txt: "الملك_فيصل.txt" },
  { id: "UB", name: "جامعة بيشة", pdf: "بيشة.pdf", txt: "بيشة.txt" },
  { id: "UTAB", name: "جامعة تبوك", pdf: "تبوك.pdf", txt: "تبوك.txt" },
  { id: "IMAMU", name: "جامعة الإمام محمد بن سعود الإسلامية", pdf: "جامعة_الإمام.pdf", txt: "جامعة_الامام.txt" },
  { id: "UON", name: "جامعة نجران", pdf: "جامعة_نجران.pdf" },
  { id: "UJED", name: "جامعة جدة", pdf: "جدة.pdf", txt: "جده.txt" },
  { id: "UOH", name: "جامعة حائل", pdf: "حائل.pdf", txt: "حائل.txt" },
  { id: "UHB", name: "جامعة حفر الباطن", pdf: "حفر_الباطن.pdf", txt: "‏جامعة حفر الباطن.txt" },
  { id: "NBU", name: "جامعة الحدود الشمالية", pdf: "دليل القبول الحدود_الشمالية ١٤٤٧هـ.pdf", txt: "جامعة الحدود الشمالية.txt" },
  { id: "IAU", name: "جامعة الإمام عبدالرحمن بن فيصل", pdf: "دليل القبولعبدالرحمن_بن_فيصل 1447هـ.pdf", txt: "عبدالرحمن_بن_فيصل.txt" },
  { id: "SU", name: "جامعة شقراء", pdf: "شقراء.pdf", txt: "شقراء.txt" },
  { id: "KKMA", name: "كلية الملك خالد العسكرية", pdf: "كلية الملك خالد العسكرية.pdf", txt: "الملك_خالد_السكرية.txt" },
];

const SIGNAL_REGEX = /(نسبة|النسبة|الموزونة|المركبة|المكافئة|ثانوية|القدرات|قدرات|تحصيلي|التحصيلي|قبول|تخصص|تخصصات|كلية|الكليات|المسار|مسارات|طلاب|طالبات|ذكر|أنثى|بكالوريوس|دبلوم|الحد الأدنى|الحد الادنى|طب|هندسة|حاسب|تمريض|صيدلة|قانون|شريعة|إدارة|ادارة|علوم|المقابلة|شروط)/i;

function cleanText(text) {
  return text
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function runPdfText(pdfPath) {
  try {
    return cleanText(execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 25 * 1024 * 1024,
    }));
  } catch {
    return "";
  }
}

function runPdfInfo(pdfPath) {
  try {
    const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
    const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
    return { pages };
  } catch {
    return { pages: 0 };
  }
}

function readFallbackTxt(source) {
  if (!source.txt) return "";
  const txtPath = path.join(txtDir, source.txt);
  if (!existsSync(txtPath)) return "";
  return cleanText(readFileSync(txtPath, "utf8"));
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function buildRelevantExcerpt(text, maxChars = 18000) {
  const lines = text.split("\n").map((line) => normalizeWhitespace(line)).filter(Boolean);
  const picked = [];
  const seen = new Set();
  let size = 0;

  for (const line of lines) {
    if (line.length < 3 || line.length > 260) continue;
    if (!SIGNAL_REGEX.test(line)) continue;
    if (seen.has(line)) continue;
    if (size + line.length + 1 > maxChars) break;
    picked.push(line);
    seen.add(line);
    size += line.length + 1;
  }

  return picked.length > 0 ? picked.join("\n") : text.slice(0, maxChars);
}

function parseJsonObject(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in model response.");
    return JSON.parse(match[0]);
  }
}

function normalizeProgram(program) {
  return {
    name: String(program.name ?? "").trim(),
    college: String(program.college ?? "").trim(),
    min_rate: program.min_rate == null ? "غير محدد" : String(program.min_rate).trim(),
    formula: program.formula == null ? "غير محددة" : String(program.formula).trim(),
    gender: program.gender == null ? "غير محدد" : String(program.gender).trim(),
    degree: program.degree == null ? undefined : String(program.degree).trim(),
    campus: program.campus == null ? undefined : String(program.campus).trim(),
    source_excerpt: program.source_excerpt == null ? undefined : String(program.source_excerpt).trim().slice(0, 280),
  };
}

async function extractProgramsWithGemini(ai, source, text) {
  if (!ai || !text) return { programs: [], extraction_notes: "Gemini extraction skipped." };

  const excerpt = buildRelevantExcerpt(text);
  const prompt = `استخرج بيانات القبول المهيكلة من مقتطف دليل القبول التالي لجامعة/جهة: ${source.name}

أعد JSON فقط بهذا الشكل:
{
  "programs": [
    {
      "name": "اسم التخصص أو مجموعة التخصصات كما وردت",
      "college": "اسم الكلية أو المسار",
      "min_rate": "النسبة أو الحد الأدنى كما ورد حرفياً، أو غير محدد",
      "formula": "صيغة النسبة كما وردت مثل 30% ثانوية + 30% قدرات + 40% تحصيلي، أو غير محددة",
      "gender": "طلاب/طالبات/طلاب وطالبات/غير محدد",
      "degree": "بكالوريوس/دبلوم/غير محدد",
      "campus": "المقر/المدينة إن وجد",
      "source_excerpt": "اقتباس قصير جداً من النص يثبت المعلومة"
    }
  ],
  "extraction_notes": "ملاحظات مختصرة عن جودة الاستخراج أو نقص البيانات"
}

قواعد صارمة:
- لا تخترع تخصصاً أو نسبة غير موجودة.
- إذا وجدت جدول حدود دنيا، استخرج صفوفه.
- إذا وجدت تخصصات بدون نسب، استخرجها مع min_rate = "غير محدد".
- إذا كانت النسبة تنافسية فقط، اكتب "تنافسي".
- اجعل source_excerpt من النص نفسه.
- لا تضف شرحاً خارج JSON.

النص:
${excerpt}`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_EXTRACTION_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.05,
      maxOutputTokens: 5000,
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonObject(response.text ?? "{}");
  return {
    programs: Array.isArray(parsed.programs)
      ? parsed.programs.map(normalizeProgram).filter((program) => program.name)
      : [],
    extraction_notes: String(parsed.extraction_notes ?? "").trim(),
  };
}

async function main() {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(txtDir, { recursive: true });

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  const universities = [];
  const report = [];

  for (const source of PDF_SOURCES) {
    const pdfPath = path.join(pdfDir, source.pdf);
    const exists = existsSync(pdfPath);
    const { pages } = exists ? runPdfInfo(pdfPath) : { pages: 0 };
    const pdfText = exists ? runPdfText(pdfPath) : "";
    const fallbackText = readFallbackTxt(source);
    const directTextTooSmall = pdfText.length < Math.max(1200, pages * 80);
    const method = !exists
      ? "missing_pdf"
      : directTextTooSmall && fallbackText
        ? "existing_txt_fallback_needs_ocr"
        : directTextTooSmall
          ? "poor_pdf_text_needs_ocr"
          : "direct_pdf_text";
    const knowledgeText = method.includes("fallback") ? fallbackText : pdfText;
    const txtOutPath = path.join(txtDir, source.txt ?? `${source.id}.txt`);
    writeFileSync(txtOutPath, knowledgeText, "utf8");

    let programs = [];
    let extractionNotes = "";
    try {
      const extracted = await extractProgramsWithGemini(ai, source, knowledgeText);
      programs = extracted.programs;
      extractionNotes = extracted.extraction_notes;
    } catch (error) {
      extractionNotes = `Gemini extraction failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    universities.push({
      id: source.id,
      name: source.name,
      source_pdf: source.pdf,
      extraction_method: method,
      programs,
      knowledge_source_txt: path.basename(txtOutPath),
      knowledge_text: knowledgeText,
    });

    report.push({
      id: source.id,
      name: source.name,
      pdf: source.pdf,
      pdf_exists: exists,
      pages,
      pdf_text_chars: pdfText.length,
      fallback_text_chars: fallbackText.length,
      final_text_chars: knowledgeText.length,
      extraction_method: method,
      programs_count: programs.length,
      extraction_notes: extractionNotes,
    });

    console.log(`${source.id}\t${method}\ttext=${knowledgeText.length}\tprograms=${programs.length}\t${source.name}`);
  }

  writeFileSync(outputPath, JSON.stringify(universities, null, 2) + "\n", "utf8");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`Saved ${outputPath}`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
