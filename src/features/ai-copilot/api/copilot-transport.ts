/**
 * The single seam between the Copilot UI and its backend.
 *
 * Two implementations behind one type:
 *
 * - `sseTransport` reads the real `POST /api/v1/ai/conversations/:id/messages`
 *   stream (§14.1). This is the default.
 * - `mockTransport` replays `mock-scenarios` on a timer, entirely in the browser.
 *   Kept — not dead code — because it is what makes the state preview and the
 *   guardrail demo reproducible without a backend or an API key, and because UI
 *   work on failure states should not require provoking real failures.
 *
 * Both emit the identical event shape (§13.3), so no component knows which one
 * it is reading.
 */

import { env } from "@/shared/lib/env";

import type { AiPageContext, AiStreamEvent } from "../types";
import {
  resolveScenario,
  type MockScenario,
  MOCK_SCENARIOS,
  type MockScenarioKey,
} from "./mock-scenarios";
import { sseTransport } from "./sse-transport";

export type SendMessageInput = {
  conversationId: string;
  prompt: string;
  context: AiPageContext;
  signal: AbortSignal;
  /** Forces a scenario instead of routing on the prompt. Used by the state preview. */
  forceScenario?: MockScenarioKey;
};

export type CopilotTransport = (input: SendMessageInput) => AsyncGenerator<AiStreamEvent>;

class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortedError";
  }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new AbortedError());
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortedError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Splits on whitespace but keeps the separator attached, so markdown markers
 * (`**`, `\n\n`, `- `) are never torn in half mid-stream and the partially
 * rendered answer stays parseable at every frame.
 */
function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

async function* replay(scenario: MockScenario, signal: AbortSignal): AsyncGenerator<AiStreamEvent> {
  yield { event: "status", data: { step: "queued" } };
  await delay(280, signal);

  yield { event: "intent", data: { intent: scenario.intent } };
  yield { event: "status", data: { step: "processing" } };

  for (const step of scenario.tools) {
    await delay(180, signal);
    yield { event: "tool_start", data: { tool: step.tool } };
    await delay(step.durationMs, signal);
    yield {
      event: "tool_result",
      data: {
        id: step.tool.id,
        status: scenario.failure?.status === "permission_denied" ? "blocked" : "succeeded",
        ...(step.detail === undefined ? {} : { detail: step.detail }),
        durationMs: step.durationMs,
      },
    };
  }

  // A hard failure with nothing to show skips straight to the error frame.
  if (scenario.failure && !scenario.answer) {
    await delay(320, signal);
    yield { event: "error", data: scenario.failure };
    return;
  }

  await delay(240, signal);
  yield { event: "status", data: { step: "streaming" } };

  for (const token of tokenize(scenario.answer)) {
    yield { event: "content_delta", data: { text: token } };
    // Punctuation gets a longer beat: it reads like considered writing rather
    // than a progress bar pretending to be text.
    await delay(/[.!?:\n]\s*$/.test(token) ? 90 : 22, signal);
  }

  for (const citation of scenario.citations) {
    yield { event: "citation", data: { citation } };
  }

  for (const card of scenario.cards) {
    await delay(220, signal);
    yield { event: "card", data: { card } };
  }

  if (scenario.actionRequest) {
    await delay(260, signal);
    yield { event: "action_request", data: { actionRequest: scenario.actionRequest } };
  }

  if (scenario.failure) {
    await delay(200, signal);
    yield { event: "error", data: scenario.failure };
    return;
  }

  await delay(160, signal);
  yield { event: "suggestions", data: { suggestions: scenario.suggestions } };
  yield {
    event: "done",
    data: {
      messageId: `msg-${Date.now().toString(36)}`,
      meta: {
        model: scenario.meta.model,
        promptVersion: scenario.meta.promptVersion,
        latencyMs: scenario.tools.reduce((total, step) => total + step.durationMs, 900),
        inputTokens: scenario.meta.inputTokens,
        outputTokens: scenario.meta.outputTokens,
      },
    },
  };
}

export const mockTransport: CopilotTransport = async function* (input) {
  const scenario = input.forceScenario
    ? MOCK_SCENARIOS[input.forceScenario]
    : resolveScenario(input.prompt);

  try {
    yield* replay(scenario, input.signal);
  } catch (error) {
    // An abort is the user pressing "Dừng"; the hook keeps whatever streamed so
    // far and marks the message `partial`. Anything else is a real fault.
    if (error instanceof AbortedError) return;
    throw error;
  }
};

/**
 * Chọn transport.
 *
 * `forceScenario` luôn đi qua mock kể cả khi đang chạy chế độ `api`: nó chỉ được
 * đặt bởi bộ xem trước trạng thái (§15.4), và mục đích của công cụ đó là dựng
 * đúng một trạng thái để chụp ảnh — không phải chờ backend thật rơi vào trạng
 * thái đó.
 */
export const copilotTransport: CopilotTransport = (input) => {
  if (input.forceScenario || env.NEXT_PUBLIC_AI_COPILOT_SOURCE === "mock") {
    return mockTransport(input);
  }
  return sseTransport(input);
};
