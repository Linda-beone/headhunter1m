import type { ResumeProvider, ParseResumeResult } from "./providers/types";
import { parseResumeWithKimi } from "./providers/kimi";
import { parseResumeWithOpenAI } from "./providers/openai";

export type { AIProviderName, ParseResumeResult, TokenUsage } from "./providers/types";

type ProviderAttempt = { name: "kimi" | "openai"; configured: boolean; parse: ResumeProvider };

function configuredProviders(): ProviderAttempt[] {
  return [
    { name: "kimi", configured: Boolean(process.env.MOONSHOT_API_KEY), parse: parseResumeWithKimi },
    { name: "openai", configured: Boolean(process.env.OPENAI_API_KEY), parse: parseResumeWithOpenAI },
  ];
}

export async function parseResumeWithProviders(
  file: File,
  signal: AbortSignal | undefined,
  providers: ProviderAttempt[],
): Promise<ParseResumeResult> {
  const available = providers.filter(provider => provider.configured);
  if (!available.length) throw new Error("AI 解析尚未配置，请设置 MOONSHOT_API_KEY；OpenAI 可作为备选。");

  const failures: string[] = [];
  for (const [index, provider] of available.entries()) {
    try {
      const result = await provider.parse(file, signal);
      return { ...result, fallbackUsed: index > 0 || provider.name !== "kimi" };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : `${provider.name} 解析失败。`);
    }
  }
  throw new Error(failures.join("；备选解析失败："));
}

/** Kimi is always attempted first; OpenAI is the automatic fallback. */
export function parseResume(file: File, signal?: AbortSignal): Promise<ParseResumeResult> {
  return parseResumeWithProviders(file, signal, configuredProviders());
}
