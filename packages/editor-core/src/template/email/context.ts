import { parseInlineMarkup, type InlineText } from '../markup/inline-markup.js';
import { escapeHtml, interpolate } from '../variables/interpolate.js';
import type { VariableType } from '../variables/variable-type.js';
import { variableTokens } from '../variables/variable-tokens.js';
import type { Variables } from '../variables/variables.js';
import type { RenderContext, RenderedBlock, RenderProblem } from './block.js';
import type { Region } from './region.js';
import type { EmailTheme } from './theme.js';

/** What one render shares across its blocks; `problems` collects as the blocks render. */
export interface RenderState {
  readonly theme: EmailTheme;
  readonly locale: string;
  readonly variables: Variables;
  readonly variableTypes: Readonly<Record<string, VariableType>>;
  readonly problems: RenderProblem[];
  /** The region every block rendered through this state sits in. */
  readonly region: Region | 'body';
}

/** A template that is one token and nothing else, whitespace around it aside. */
const SINGLE_TOKEN = /^\{\{(\w+)\}\}$/;

/** The schemes a link may carry: a page, or an address to write to. A `javascript:` link runs in a webmail tab. */
const LINK_SCHEME = /^(?:https?:|mailto:)/i;

const NO_LINK: RenderedBlock = { html: '', text: '' };

/** The context one block renders through, reporting into `state.problems` under `blockId`. */
export function createRenderContext(
  state: RenderState,
  blockId: string | null,
  lane: (index: number) => RenderedBlock,
): RenderContext {
  const report = (kind: RenderProblem['kind'], name?: string): void => {
    state.problems.push({
      blockId,
      kind,
      ...(name === undefined ? {} : { name }),
      ...(state.region === 'body' ? {} : { region: state.region }),
    });
  };
  // Own entries only: a token named after an Object member must read as unfilled, not as that member.
  const valueOf = (name: string): string | null => {
    const held = Object.hasOwn(state.variables, name) ? state.variables[name] : null;
    return typeof held === 'string' ? held : null;
  };
  const reportMissing = (template: string): void => {
    for (const name of variableTokens(template)) {
      if (valueOf(name) === null) report('variable-missing', name);
    }
  };
  const context: RenderContext = {
    theme: state.theme,
    locale: state.locale,
    region: state.region,
    html(template): string {
      reportMissing(template);
      return escapeHtml(interpolate(template, state.variables, 'text'));
    },
    markup(template): string {
      reportMissing(template);
      return interpolate(template, state.variables, 'html');
    },
    text(template): string {
      reportMissing(template);
      return interpolate(template, state.variables, 'text');
    },
    href(template): RenderedBlock {
      const name = SINGLE_TOKEN.exec(template.trim())?.[1];
      if (name === undefined || !Object.hasOwn(state.variableTypes, name) || state.variableTypes[name] !== 'url') {
        report('href-not-url-variable', name);
        return NO_LINK;
      }
      const value = valueOf(name);
      if (value === null) {
        report('variable-missing', name);
        return NO_LINK;
      }
      if (!LINK_SCHEME.test(value.trim())) {
        report('href-scheme-refused', name);
        return NO_LINK;
      }
      return { html: escapeHtml(value), text: value };
    },
    inline(template): RenderedBlock {
      reportMissing(template);
      const parsed = parseInlineMarkup(template);
      if (!parsed.ok) {
        return {
          html: escapeHtml(interpolate(template, state.variables, 'text')),
          text: interpolate(template, state.variables, 'text'),
        };
      }
      const fill = (text: string): string => interpolate(text, state.variables, 'text');
      const drawText = (run: InlineText): RenderedBlock => {
        let html = escapeHtml(fill(run.text));
        if (run.italic) html = `<em>${html}</em>`;
        if (run.bold) html = `<strong>${html}</strong>`;
        return { html, text: fill(run.text) };
      };
      const parts = parsed.runs.map((run): RenderedBlock => {
        if (run.kind === 'text') return drawText(run);
        const label = run.label.map(drawText);
        const labelHtml = label.map((part) => part.html).join('');
        const labelText = label.map((part) => part.text).join('');
        const href = context.href(`{{${run.variable}}}`);
        if (href.html === '') return { html: labelHtml, text: labelText };
        return {
          html: `<a href="${href.html}" style="color:${state.theme.colors.primary};">${labelHtml}</a>`,
          text: `${labelText} (${href.text})`,
        };
      });
      return { html: parts.map((part) => part.html).join(''), text: parts.map((part) => part.text).join('') };
    },
    lane,
  };
  return context;
}
