import type { ParsedResume } from "../schemas/resume";

export type AIProviderName = "kimi" | "openai";
export type TokenUsage = { inputTokens?: number; outputTokens?: number; totalTokens?: number; cachedTokens?: number };
export type ParseResumeResult = {
  parsed: ParsedResume;
  provider: AIProviderName;
  fileId: string;
  responseId: string;
  durationMs: number;
  fallbackUsed: boolean;
  tokenUsage?: TokenUsage;
};
export type ProviderParseResult = Omit<ParseResumeResult, "fallbackUsed">;
export type ResumeProvider = (file: File, signal?: AbortSignal) => Promise<ProviderParseResult>;
