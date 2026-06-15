import { GoogleGenAI } from "@google/genai";
import {
  buildAdvisorSummary,
  buildLocalAdvisorReply,
  type AdvisorSummary,
  type UserProfile,
} from "@/lib/local-advisor";
import { buildKnowledgeContext } from "@/lib/json-knowledge";
import { getUniversitiesData } from "@/lib/data-source";
import { parseGender, isMaleOnly, isFemaleOnly } from "@/lib/utils";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProviderResponse = {
  text: string;
  provider: "gemini";
};

class GeminiProviderError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, options: { status?: number; retryable?: boolean } = {}) {
    super(message);
    this.name = "GeminiProviderError";
    this.status = options.status;
    this.retryable = options.retryable ?? false;
  }
}

const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
const geminiMaxRetries = Math.max(
  1,
  Number.parseInt(process.env.GEMINI_MAX_RETRIES ?? "2", 10)
);
const geminiRetryDelayMs = Math.max(
  300,
  Number.parseInt(process.env.GEMINI_RETRY_DELAY_MS ?? "900", 10)
);
const geminiMaxOutputTokens = Math.max(
  250,
  Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "700", 10)
);
const geminiResponseMode = (process.env.GEMINI_RESPONSE_MODE ?? "off").toLowerCase();

const geminiClient = geminiApiKey
  ? new GoogleGenAI({ apiKey: geminiApiKey })
  : null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractStatus(error: unknown) {
  const maybeStatus = (error as { status?: unknown; code?: unknown })?.status;
  if (typeof maybeStatus === "number") {
    return maybeStatus;
  }

  const maybeCode = (error as { code?: unknown })?.code;
  return typeof maybeCode === "number" ? maybeCode : undefined;
}

function shouldRetryGemini(status: number | undefined, message: string) {
  if (status && [408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const text = message.toLowerCase();
  return (
    text.includes("rate limit") ||
    text.includes("quota") ||
    text.includes("temporar") ||
    text.includes("overloaded")
  );
}

function toReadableGeminiMessage(status: number | undefined, message: string) {
  const normalized = message.toLowerCase();

  if (status === 400 && normalized.includes("api key")) {
    return "GEMINI_API_KEY غير صحيح.";
  }

  if (status === 401 || status === 403) {
    return "مفتاح Gemini غير مصرح له. تأكد من المفتاح والصلاحيات.";
  }

  if (status === 429 || normalized.includes("quota")) {
    return "تم بلوغ حد استخدام Gemini أو الحصة المتاحة مؤقتاً.";
  }

  return message;
}

function buildGeminiPrompt(summary: AdvisorSummary, knowledgeContext: string) {
  const structuredIsIncomplete = !summary.dataCoverage.isComplete;

  return `رسالة الطالب:
${summary.latestUserMessage}

نتائج الحساب المحلي:
${JSON.stringify(
  {
    scores: summary.scores,
    weighted: summary.weighted,
    equivalent: summary.equivalent,
    mentionedUniversity: summary.mentionedUniversity,
    mentionedUniversities: summary.mentionedUniversities,
    dataCoverage: summary.dataCoverage,
    recommendationsScope: structuredIsIncomplete
      ? "غير شاملة؛ البرامج المهيكلة متوفرة لبعض الجامعات فقط، ولا يجوز اعتبار غياب جامعة من recommendations دليلاً أنها غير مناسبة."
      : "شاملة حسب البيانات المهيكلة المتاحة.",
    recommendations: summary.recommendations,
    universityContexts: summary.universityContexts,
  },
  null,
  2
)}

${knowledgeContext ? `مقتطفات من أدلة القبول الرسمية المستخرجة من ملفات Word/PDF:
${knowledgeContext}
` : ""}
اكتب رداً عربياً نهائياً للطالب اعتماداً على النتائج والمقتطفات أعلاه فقط.
إذا كانت recommendations غير فارغة، اجعل قائمة التوصيات من recommendations فقط ولا تذكر أي جامعة أو برنامج خارجها.
إذا كانت mentionedUniversities تحتوي أكثر من جامعة، ناقش كل جامعة مذكورة ولا تحصر الإجابة في أول جامعة.
إذا كانت dataCoverage.isComplete = false، اذكر أن المقارنة غير نهائية لأن البرامج المهيكلة لا تغطي كل الجامعات.`;
}

function shouldUseGeminiResponse(enhanceWithGemini: unknown) {
  if (!geminiClient) {
    return false;
  }

  return enhanceWithGemini === true || geminiResponseMode === "always";
}

async function callGemini(
  summary: AdvisorSummary,
  knowledgeContext: string
): Promise<ProviderResponse> {
  if (!geminiClient) {
    throw new GeminiProviderError("GEMINI_API_KEY غير موجود.");
  }

  let lastError: GeminiProviderError | null = null;
  for (let attempt = 1; attempt <= geminiMaxRetries; attempt += 1) {
    try {
      const response = await geminiClient.models.generateContent({
        model: geminiModel,
        contents: buildGeminiPrompt(summary, knowledgeContext),
        config: {
          systemInstruction: `أنت مستشار قبول جامعي سعودي خبير اسمك "نُلِم".

مهمتك صياغة نتائج الحساب المحلي بشكل واضح ومفيد، وليس إعادة الحساب من الصفر.

القواعد:
1. اعتمد على نتائج الحساب المحلي ومقتطفات الأدلة المرفقة فقط.
2. إذا كانت البرامج المهيكلة ناقصة، لا تجعل recommendations قائمة نهائية ولا تكرر جامعة واحدة كأنها الخيار الوحيد. استخدم مقتطفات أدلة القبول الرسمية المرفقة، وصرّح أن الإجابة مبنية على نص الدليل لا على جدول مهيكل كامل.
3. إذا كانت recommendations فارغة لكن universityContexts موجودة، أجب من مقتطف الجامعة وصرّح أن البيانات المهيكلة للتخصصات غير مكتملة.
4. لا تضف جامعة أو تخصصاً غير موجود في النتائج أو مقتطفات الدليل.
4.1 إذا كانت recommendations غير فارغة، فلا تستخدم إلا الجامعات والبرامج الموجودة داخل recommendations عند عرض التوصيات.
5. لا تختلق نسب قبول أو شروطاً غير مذكورة.
6. اذكر النسبة الموزونة والمكافئة إذا كانت موجودة.
7. إذا ذكر الطالب عدة جامعات، قارن الجامعات المذكورة كلها ولا تكتفي بأول جامعة في الرسالة.
8. وضّح معنى مرتفعة / متوسطة / منخفضة باختصار عند وجود توصيات محسوبة.
9. اختم بنصيحة عملية قصيرة عن ترتيب الرغبات والتحقق من شروط الجامعة وقت التقديم.

الأسلوب: عربي مبسط، دافئ، واضح، ومختصر.`,
          temperature: 0.35,
          maxOutputTokens: geminiMaxOutputTokens,
        },
      });

      const text = response.text?.trim() ?? "";
      if (!text) {
        throw new GeminiProviderError("Gemini أعاد نصاً فارغاً.");
      }

      return { text, provider: "gemini" };
    } catch (error) {
      const status = extractStatus(error);
      const message = error instanceof Error ? error.message : "Gemini unknown error.";
      const readableMessage = toReadableGeminiMessage(status, message);
      const retryable = shouldRetryGemini(status, readableMessage);
      lastError = new GeminiProviderError(readableMessage, {
        status,
        retryable,
      });

      if (!retryable || attempt === geminiMaxRetries) {
        break;
      }

      await sleep(geminiRetryDelayMs * attempt);
    }
  }

  throw lastError ?? new GeminiProviderError("فشل الاتصال بـ Gemini.");
}

// ─── Simple in-memory rate limiter ───
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  // Rate limiting
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return Response.json(
      { error: { message: "عدد الطلبات تجاوز الحد المسموح. حاول بعد دقيقة." } },
      { status: 429 }
    );
  }

  try {
    const { messages, userProfile, enhanceWithGemini } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: { message: "messages يجب أن تكون مصفوفة غير فارغة." } },
        { status: 400 }
      );
    }

    const sanitizedMessages: ChatMessage[] = messages
      .filter(
        (message: { role?: string; content?: string }) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0
      )
      .slice(-6);

    if (sanitizedMessages.length === 0) {
      return Response.json(
        { error: { message: "لم يتم العثور على رسائل صالحة." } },
        { status: 400 }
      );
    }

    const profile: UserProfile | undefined =
      userProfile && typeof userProfile === "object" ? userProfile : undefined;

    // استخدم parseGender الموحّدة من utils (النص أولاً ثم الـ profile)
    const latestMessage = sanitizedMessages.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
    const userGender = parseGender(latestMessage, profile?.gender);

    // Hard-Filtering by Gender
    let filteredUniversities = getUniversitiesData();

    if (userGender === "male") {
      filteredUniversities = filteredUniversities
        .map((uni) => ({
          ...uni,
          programs: uni.programs?.filter((p) => !isFemaleOnly(p.gender)),
        }))
        .filter((uni) => uni.programs && uni.programs.length > 0);
    } else if (userGender === "female") {
      filteredUniversities = filteredUniversities
        .map((uni) => ({
          ...uni,
          programs: uni.programs?.filter((p) => !isMaleOnly(p.gender)),
        }))
        .filter((uni) => uni.programs && uni.programs.length > 0);
    }

    const localText = buildLocalAdvisorReply(
      sanitizedMessages,
      undefined,
      profile,
      filteredUniversities
    );
    const useGemini = shouldUseGeminiResponse(enhanceWithGemini);

    if (!useGemini) {
      return Response.json({
        provider: "local",
        content: [{ type: "text", text: localText }],
      });
    }

    const summary = buildAdvisorSummary(sanitizedMessages, profile, filteredUniversities);
    const mentionedCount = summary.mentionedUniversities.length;
    const { context: knowledgeContext } = buildKnowledgeContext(
      summary.latestUserMessage,
      {
        maxDocs: summary.mentionedUniversity ? 1 : Math.max(4, mentionedCount),
        maxCharsPerDoc: summary.mentionedUniversity ? 3000 : 1800,
      },
      filteredUniversities
    );
    
    if (
      summary.recommendations.length === 0 &&
      summary.universityContexts.length === 0 &&
      !knowledgeContext
    ) {
      return Response.json({
        provider: "local",
        content: [{ type: "text", text: localText }],
      });
    }

    let providerResponse: ProviderResponse;
    try {
      providerResponse = await callGemini(summary, knowledgeContext);
    } catch {
      return Response.json({
        provider: "local",
        content: [{ type: "text", text: localText }],
      });
    }

    return Response.json({
      provider: providerResponse.provider,
      content: [{ type: "text", text: providerResponse.text }],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
    return Response.json({ error: { message } }, { status: 500 });
  }
}
