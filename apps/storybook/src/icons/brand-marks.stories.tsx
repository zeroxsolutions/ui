import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';

// Existing marks (single-variant, pre-lobehub vendoring).
import { DeepgramMark } from '@zeroxsolutions/icons/brands/deepgram';
import { GithubMark } from '@zeroxsolutions/icons/brands/github-mark';
import { LeonardoMark } from '@zeroxsolutions/icons/brands/leonardo';

// Model labs / providers.
import { OpenaiMark } from '@zeroxsolutions/icons/brands/openai';
import { AnthropicMark } from '@zeroxsolutions/icons/brands/anthropic';
import { ClaudeMark } from '@zeroxsolutions/icons/brands/claude';
import { GeminiMark } from '@zeroxsolutions/icons/brands/gemini';
import { MistralMark } from '@zeroxsolutions/icons/brands/mistral';
import { GrokMark } from '@zeroxsolutions/icons/brands/grok';
import { QwenMark } from '@zeroxsolutions/icons/brands/qwen';
import { PerplexityMark } from '@zeroxsolutions/icons/brands/perplexity';
import { NvidiaMark } from '@zeroxsolutions/icons/brands/nvidia';

// Inference / hosting.
import { HuggingfaceMark } from '@zeroxsolutions/icons/brands/huggingface';
import { GroqMark } from '@zeroxsolutions/icons/brands/groq';
import { OllamaMark } from '@zeroxsolutions/icons/brands/ollama';
import { CerebrasMark } from '@zeroxsolutions/icons/brands/cerebras';

// Voice / gen-media / agent tooling.
import { ElevenlabsMark } from '@zeroxsolutions/icons/brands/elevenlabs';
import { MidjourneyMark } from '@zeroxsolutions/icons/brands/midjourney';
import { LangchainMark } from '@zeroxsolutions/icons/brands/langchain';

// Dev / cloud / infra (simple-icons).
import { CloudflareMark } from '@zeroxsolutions/icons/brands/cloudflare';
import { VercelMark } from '@zeroxsolutions/icons/brands/vercel';
import { StripeMark } from '@zeroxsolutions/icons/brands/stripe';
import { SupabaseMark } from '@zeroxsolutions/icons/brands/supabase';

/**
 * Visual catalog of `@zeroxsolutions/icons/brands` — a self-sufficient AI +
 * dev/infra brand-mark set (129 marks), vendored from `@lobehub/icons` (AI) and
 * Simple Icons (dev/infra). Each mark is a compound component exposing the lobehub
 * variant surface **where each variant exists**: base + `.Color` / `.Mono` /
 * `.Avatar` / `.Text` / `.Combine`. `GithubMark` keeps its `className`/`currentColor`
 * API (the one documented exception).
 */
const meta: Meta = {
  title: 'Icons/Brand Marks',
};
export default meta;

type Story = StoryObj;
type Mark = ComponentType<{ size?: string | number }>;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-28 flex-col items-center gap-2 rounded-lg border p-4">
      <div className="flex h-10 items-center justify-center text-3xl">{children}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const bases: [string, Mark][] = [
  ['Openai', OpenaiMark],
  ['Anthropic', AnthropicMark],
  ['Claude', ClaudeMark],
  ['Gemini', GeminiMark],
  ['Mistral', MistralMark],
  ['Grok', GrokMark],
  ['Qwen', QwenMark],
  ['Perplexity', PerplexityMark],
  ['Nvidia', NvidiaMark],
  ['Huggingface', HuggingfaceMark],
  ['Groq', GroqMark],
  ['Ollama', OllamaMark],
  ['Cerebras', CerebrasMark],
  ['Elevenlabs', ElevenlabsMark],
  ['Midjourney', MidjourneyMark],
  ['Langchain', LangchainMark],
  ['Cloudflare', CloudflareMark],
  ['Vercel', VercelMark],
  ['Stripe', StripeMark],
  ['Supabase', SupabaseMark],
  ['Deepgram', DeepgramMark],
  ['Leonardo', LeonardoMark],
];

/** A representative selection of mark bases, sized with the font-relative `size="1em"`. */
export const AllBases: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Cell label="GithubMark">
        <GithubMark className="size-7" />
      </Cell>
      {bases.map(([label, Mark]) => (
        <Cell key={label} label={label}>
          <Mark size="1em" />
        </Cell>
      ))}
    </div>
  ),
};

/**
 * The full variant surface on one gradient brand (Gemini has all five). Each
 * variant is rendered only if the mark exposes it — a mark ships only the
 * variants that exist for its brand.
 */
export const VariantSurface: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <Cell label="base">
        <GeminiMark size="2rem" />
      </Cell>
      {GeminiMark.Color ? (
        <Cell label=".Color">
          <GeminiMark.Color size="2rem" />
        </Cell>
      ) : null}
      {GeminiMark.Mono ? (
        <Cell label=".Mono">
          <GeminiMark.Mono size="2rem" />
        </Cell>
      ) : null}
      {GeminiMark.Avatar ? (
        <Cell label=".Avatar">
          <GeminiMark.Avatar size={40} />
        </Cell>
      ) : null}
      {GeminiMark.Text ? (
        <Cell label=".Text">
          <GeminiMark.Text style={{ height: 24 }} />
        </Cell>
      ) : null}
      {GeminiMark.Combine ? (
        <Cell label=".Combine">
          <GeminiMark.Combine size={24} />
        </Cell>
      ) : null}
    </div>
  ),
};

/** `.Color` (intrinsic brand colours) beside `.Mono` (inherits `currentColor`). */
export const ColorVsMono: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6 text-sky-600">
      {(
        [
          ['Claude', ClaudeMark],
          ['Mistral', MistralMark],
          ['Cloudflare', CloudflareMark],
          ['Supabase', SupabaseMark],
        ] as [string, Mark & { Color?: Mark; Mono?: Mark }][]
      ).map(([label, M]) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-4xl">
            {M.Color ? <M.Color size="1em" /> : null}
            {M.Mono ? <M.Mono size="1em" /> : null}
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
};
