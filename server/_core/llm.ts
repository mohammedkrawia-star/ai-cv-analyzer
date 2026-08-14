// Thin wrapper around the Anthropic Messages API.
// This replaces the old Manus "forge" gateway so the app runs fully
// independently with your own Anthropic API key (ANTHROPIC_API_KEY).
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

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
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
  if (!ENV.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it in your server environment (see .env.example).",
    );
  }
};

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const toAnthropicBlock = (part: MessageContent): AnthropicContentBlock => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  if (part.type === "file_url") {
    const dataUrl = part.file_url.url;
    const base64 = dataUrl.includes(",") ? dataUrl.split(",").slice(1).join(",") : dataUrl;
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    };
  }
  throw new Error("Unsupported message content part");
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const { messages, model, maxTokens, max_tokens } = params;

  // Anthropic takes `system` as a separate top-level field, not a message role.
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => ensureArray(m.content).map(toAnthropicBlock))
    .flat()
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: ensureArray(m.content).map(toAnthropicBlock),
    }));

  const payload: Record<string, unknown> = {
    model: model || ENV.anthropicModel,
    max_tokens: max_tokens ?? maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: conversation,
  };
  if (systemParts) {
    payload.system = systemParts;
  }

  const response = await fetchWithBackoff(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = (await response.json()) as {
    id: string;
    model: string;
    content: Array<{ type: string; text?: string }>;
    stop_reason: string | null;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = (data.content || [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();

  return {
    id: data.id,
    model: data.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: data.stop_reason,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}
