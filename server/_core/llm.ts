// Thin wrapper around the Google Gemini API (generateContent).
// Uses the free tier — no credit card required. Get a key at
// https://aistudio.google.com/apikey and set GEMINI_API_KEY.
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type TextContent = {
  type: "text";
  text: string;
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string; // data:application/pdf;base64,....
    mime_type?: "application/pdf";
  };
};

export type MessageContent = string | TextContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
};

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  max_tokens?: number;
  model?: string;
};

export type InvokeResult = {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MAX_TOKENS = 8192;

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

const computeBackoffDelay = (attempt: number, retryAfterMs?: number): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

const fetchWithBackoff = async (url: string, init: RequestInit): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      // Don't retry on 4xx client errors (bad request, auth, etc.) except 429.
      if (response.status < 500 && response.status !== 429) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `[LLM] retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`,
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(`[LLM] retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`);
      await sleep(computeBackoffDelay(attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};

const assertApiKey = () => {
  if (!ENV.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it in your server environment (see .env.example). Get a free key at https://aistudio.google.com/apikey",
    );
  }
};

type GeminiPart = { text: string } | { inline_data: { mime_type: "application/pdf"; data: string } };

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const toGeminiPart = (part: MessageContent): GeminiPart => {
  if (typeof part === "string") {
    return { text: part };
  }
  if (part.type === "text") {
    return { text: part.text };
  }
  if (part.type === "file_url") {
    const dataUrl = part.file_url.url;
    const base64 = dataUrl.includes(",") ? dataUrl.split(",").slice(1).join(",") : dataUrl;
    return { inline_data: { mime_type: "application/pdf", data: base64 } };
  }
  throw new Error("Unsupported message content part");
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const { messages, model, maxTokens, max_tokens } = params;

  // Gemini takes system instructions as a separate top-level field.
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => ensureArray(m.content).map(toGeminiPart))
    .flat()
    .filter((p): p is { text: string } => "text" in p)
    .map((p) => p.text)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: ensureArray(m.content).map(toGeminiPart),
    }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: max_tokens ?? maxTokens ?? DEFAULT_MAX_TOKENS,
    },
  };
  if (systemParts) {
    payload.system_instruction = { parts: [{ text: systemParts }] };
  }

  const resolvedModel = model || ENV.geminiModel;
  const url = `${GEMINI_API_BASE}/${resolvedModel}:generateContent`;

  const response = await fetchWithBackoff(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": ENV.geminiApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    modelVersion?: string;
  };

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .filter((p) => typeof p.text === "string")
    .map((p) => p.text as string)
    .join("\n")
    .trim();

  return {
    id: `gemini-${Date.now()}`,
    model: data.modelVersion || resolvedModel,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: data.candidates?.[0]?.finishReason ?? null,
      },
    ],
    usage: data.usageMetadata
      ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}
