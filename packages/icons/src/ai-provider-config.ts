import type { ComponentType, FC } from 'react';

import { AnthropicMark } from './brands/anthropic';
import { AssemblyaiMark } from './brands/assemblyai';
import { AzureMark } from './brands/azure';
import { Ai4bharatMark } from './brands/ai4bharat';
import { BaaiMark } from './brands/baai';
import { BailianMark } from './brands/bailian';
import { BflMark } from './brands/bfl';
import { BytedanceMark } from './brands/bytedance';
import { ClaudeMark } from './brands/claude';
import { CloudflareMark } from './brands/cloudflare';
import { CodexMark } from './brands/codex';
import { DeepgramMark } from './brands/deepgram';
import { DeepseekMark } from './brands/deepseek';
import { DoubaoMark } from './brands/doubao';
import { FluxMark } from './brands/flux';
import { GemmaMark } from './brands/gemma';
import { GeminiMark } from './brands/gemini';
import { GoogleMark } from './brands/google';
import { GrokMark } from './brands/grok';
import { GroqMark } from './brands/groq';
import { HuggingfaceMark } from './brands/huggingface';
import { IbmMark } from './brands/ibm';
import { InworldMark } from './brands/inworld';
import type { IconAvatarProps } from './brands/internal/avatar';
import type { IconCombineProps } from './brands/internal/combine';
import type { IconProps } from './brands/internal/types';
import { KimiMark } from './brands/kimi';
import { LeonardoMark } from './brands/leonardo';
import { LlavaMark } from './brands/llava';
import { MetaMark } from './brands/meta';
import { MicrosoftMark } from './brands/microsoft';
import { MinimaxMark } from './brands/minimax';
import { MistralMark } from './brands/mistral';
import { ModelscopeMark } from './brands/modelscope';
import { MoonshotMark } from './brands/moonshot';
import { MyshellMark } from './brands/myshell';
import { NewApiMark } from './brands/new-api';
import { NvidiaMark } from './brands/nvidia';
import { OllamaMark } from './brands/ollama';
import { OpenaiMark } from './brands/openai';
import { OpenrouterMark } from './brands/openrouter';
import { PipecatMark } from './brands/pipecat';
import { PixverseMark } from './brands/pixverse';
import { QwenMark } from './brands/qwen';
import { RecraftMark } from './brands/recraft';
import { RunwayMark } from './brands/runway';
import { StabilityAiMark } from './brands/stability-ai';
import { StepfunMark } from './brands/stepfun';
import { VolcengineMark } from './brands/volcengine';
import { ViduMark } from './brands/vidu';
import { WorkersAiMark } from './brands/workers-ai';
import { XiaomiMimoMark } from './brands/xiaomi-mimo';
import { ZaiMark } from './brands/zai';
import { ZhipuMark } from './brands/zhipu';

/**
 * A vendored brand mark: a callable icon plus the optional variant statics
 * (`.Mono` / `.Color` / `.Text` / `.Avatar` / `.Combine`) that fuller marks
 * attach. Bare marks (no statics) satisfy this too - the resolver degrades to
 * the base callable when a requested variant is absent.
 */
export type BrandMark = ComponentType<IconProps> &
  Partial<{
    Mono: FC<IconProps>;
    Color: FC<IconProps>;
    Text: FC<IconProps>;
    Avatar: FC<IconAvatarProps>;
    Combine: FC<IconCombineProps>;
    colorPrimary: string;
  }>;

/** One entry in the AI provider registry: the keys that resolve to a mark. */
export interface AiProviderMapping {
  /** Provider keys (matched case-insensitively, exact) that resolve to `Icon`. */
  keywords: string[];
  /** The vendored brand mark rendered for any of `keywords`. */
  Icon: BrandMark;
}

/**
 * The AI provider registry: each entry maps one or more provider keys to a
 * vendored brand mark. Scoped to AI model / inference providers only - non-AI
 * brands the package vendors are intentionally absent here.
 */
export const aiProviderMappings: AiProviderMapping[] = [
  { keywords: ['anthropic'], Icon: AnthropicMark },
  { keywords: ['claude', 'claude-code'], Icon: ClaudeMark },
  { keywords: ['openai'], Icon: OpenaiMark },
  { keywords: ['codex'], Icon: CodexMark },
  { keywords: ['gemini'], Icon: GeminiMark },
  { keywords: ['gemma'], Icon: GemmaMark },
  { keywords: ['google'], Icon: GoogleMark },
  { keywords: ['openrouter'], Icon: OpenrouterMark },
  { keywords: ['deepseek'], Icon: DeepseekMark },
  { keywords: ['groq'], Icon: GroqMark },
  { keywords: ['mistral'], Icon: MistralMark },
  { keywords: ['xai', 'grok'], Icon: GrokMark },
  { keywords: ['azure'], Icon: AzureMark },
  { keywords: ['volcengine'], Icon: VolcengineMark },
  { keywords: ['ollama'], Icon: OllamaMark },
  { keywords: ['newapi'], Icon: NewApiMark },
  { keywords: ['minimax'], Icon: MinimaxMark },
  { keywords: ['zhipu'], Icon: ZhipuMark },
  { keywords: ['zai'], Icon: ZaiMark },
  { keywords: ['kimi'], Icon: KimiMark },
  { keywords: ['moonshot'], Icon: MoonshotMark },
  { keywords: ['qwen', 'alibaba'], Icon: QwenMark },
  { keywords: ['bailian'], Icon: BailianMark },
  { keywords: ['doubao'], Icon: DoubaoMark },
  { keywords: ['xiaomi'], Icon: XiaomiMimoMark },
  { keywords: ['modelscope'], Icon: ModelscopeMark },
  { keywords: ['stepfun'], Icon: StepfunMark },
  { keywords: ['nvidia'], Icon: NvidiaMark },
  { keywords: ['meta'], Icon: MetaMark },
  { keywords: ['bfl'], Icon: BflMark },
  { keywords: ['flux'], Icon: FluxMark },
  { keywords: ['stability'], Icon: StabilityAiMark },
  { keywords: ['bytedance'], Icon: BytedanceMark },
  { keywords: ['cloudflare'], Icon: CloudflareMark },
  { keywords: ['workersai'], Icon: WorkersAiMark },
  { keywords: ['baai'], Icon: BaaiMark },
  { keywords: ['ibm'], Icon: IbmMark },
  { keywords: ['llava'], Icon: LlavaMark },
  { keywords: ['myshell'], Icon: MyshellMark },
  { keywords: ['recraft'], Icon: RecraftMark },
  { keywords: ['pixverse'], Icon: PixverseMark },
  { keywords: ['vidu'], Icon: ViduMark },
  { keywords: ['runway'], Icon: RunwayMark },
  { keywords: ['assemblyai'], Icon: AssemblyaiMark },
  { keywords: ['microsoft'], Icon: MicrosoftMark },
  { keywords: ['huggingface'], Icon: HuggingfaceMark },
  { keywords: ['pipecat'], Icon: PipecatMark },
  { keywords: ['inworld'], Icon: InworldMark },
  { keywords: ['deepgram'], Icon: DeepgramMark },
  { keywords: ['leonardo'], Icon: LeonardoMark },
  { keywords: ['ai4bharat'], Icon: Ai4bharatMark },
];

/**
 * Resolve an AI provider key to its vendored brand mark, case-insensitively.
 * @param provider The provider key (e.g. `openai`, `claude-code`, `bfl`).
 * @param extra Additional mappings checked before the built-in registry, so an
 *   app can add or override keys without forking the shared config.
 * @returns The matching `BrandMark`, or `undefined` when no key matches.
 */
export function resolveAiProviderMark(
  provider: string,
  extra?: AiProviderMapping[],
): BrandMark | undefined {
  const key = provider.trim().toLowerCase();
  const registry = extra ? [...extra, ...aiProviderMappings] : aiProviderMappings;
  return registry.find((entry) =>
    entry.keywords.some((keyword) => keyword.toLowerCase() === key),
  )?.Icon;
}
