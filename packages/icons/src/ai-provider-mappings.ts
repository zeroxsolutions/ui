import type { BrandMarkName } from './lib/brand-manifest';

/** One entry in the AI provider registry: the keys that resolve to a mark. */
export interface AiProviderMapping {
  /** Provider keys (matched case-insensitively, exact) that resolve to `mark`. */
  keywords: string[];
  /** The brand drawn for any of `keywords`. */
  mark: BrandMarkName;
}

/**
 * The AI provider registry: each entry maps one or more provider keys to a
 * brand mark. Scoped to AI model / inference providers only - non-AI
 * brands the package vendors are intentionally absent here.
 */
export const aiProviderMappings: AiProviderMapping[] = [
  { keywords: ['anthropic'], mark: 'anthropic' },
  { keywords: ['claude', 'claude-code'], mark: 'claude' },
  { keywords: ['openai'], mark: 'openai' },
  { keywords: ['codex'], mark: 'codex' },
  { keywords: ['gemini'], mark: 'gemini' },
  { keywords: ['gemma'], mark: 'gemma' },
  { keywords: ['google'], mark: 'google' },
  { keywords: ['openrouter'], mark: 'openrouter' },
  { keywords: ['deepseek'], mark: 'deepseek' },
  { keywords: ['groq'], mark: 'groq' },
  { keywords: ['mistral'], mark: 'mistral' },
  { keywords: ['xai', 'grok'], mark: 'grok' },
  { keywords: ['azure'], mark: 'azure' },
  { keywords: ['volcengine'], mark: 'volcengine' },
  { keywords: ['ollama'], mark: 'ollama' },
  { keywords: ['newapi'], mark: 'new-api' },
  { keywords: ['minimax'], mark: 'minimax' },
  { keywords: ['zhipu'], mark: 'zhipu' },
  { keywords: ['zai'], mark: 'zai' },
  { keywords: ['kimi'], mark: 'kimi' },
  { keywords: ['moonshot'], mark: 'moonshot' },
  { keywords: ['qwen', 'alibaba'], mark: 'qwen' },
  { keywords: ['bailian'], mark: 'bailian' },
  { keywords: ['doubao'], mark: 'doubao' },
  { keywords: ['xiaomi'], mark: 'xiaomi-mimo' },
  { keywords: ['modelscope'], mark: 'modelscope' },
  { keywords: ['stepfun'], mark: 'stepfun' },
  { keywords: ['nvidia'], mark: 'nvidia' },
  { keywords: ['meta'], mark: 'meta' },
  { keywords: ['bfl'], mark: 'bfl' },
  { keywords: ['flux'], mark: 'flux' },
  { keywords: ['stability'], mark: 'stability-ai' },
  { keywords: ['bytedance'], mark: 'bytedance' },
  { keywords: ['cloudflare'], mark: 'cloudflare' },
  { keywords: ['workersai'], mark: 'workers-ai' },
  { keywords: ['baai'], mark: 'baai' },
  { keywords: ['ibm'], mark: 'ibm' },
  { keywords: ['llava'], mark: 'llava' },
  { keywords: ['myshell'], mark: 'myshell' },
  { keywords: ['recraft'], mark: 'recraft' },
  { keywords: ['pixverse'], mark: 'pixverse' },
  { keywords: ['vidu'], mark: 'vidu' },
  { keywords: ['runway'], mark: 'runway' },
  { keywords: ['assemblyai'], mark: 'assemblyai' },
  { keywords: ['microsoft'], mark: 'microsoft' },
  { keywords: ['huggingface'], mark: 'huggingface' },
  { keywords: ['pipecat'], mark: 'pipecat' },
  { keywords: ['inworld'], mark: 'inworld' },
  { keywords: ['deepgram'], mark: 'deepgram' },
  { keywords: ['leonardo'], mark: 'leonardo' },
  { keywords: ['ai4bharat'], mark: 'ai4bharat' },
];

/**
 * Resolve an AI provider key to its brand mark, case-insensitively.
 * @param provider The provider key (e.g. `openai`, `claude-code`, `bfl`).
 * @param extra Additional mappings checked before the built-in registry, so an
 *   app can add or override keys without forking the shared config.
 * @returns The matching `BrandMarkName`, or `undefined` when no key matches.
 */
export function resolveAiProviderMark(provider: string, extra?: AiProviderMapping[]): BrandMarkName | undefined {
  const key = provider.trim().toLowerCase();
  const registry = extra ? [...extra, ...aiProviderMappings] : aiProviderMappings;
  return registry.find((entry) => entry.keywords.some((keyword) => keyword.toLowerCase() === key))?.mark;
}
