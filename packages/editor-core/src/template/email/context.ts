import { hrefProblem, leadingToken } from '../markup/href.js';
import { parseInlineMarkup, type InlineText } from '../markup/inline-markup.js';
import { escapeHtml, interpolate } from '../variables/interpolate.js';
import type { VariableType } from '../variables/variable-type.js';
import { VARIABLE_TOKEN, variableTokens } from '../variables/variable-tokens.js';
import type { Variables } from '../variables/variables.js';
import type { RenderContext, RenderedBlock, RenderProblem } from './block.js';
import type { Region } from './region.js';
import { CONTENT_WIDTH } from './blocks/shared.js';
import { surfaceColorOf, textColorOf } from './css/base-stylesheet.js';
import { resolveEmailTheme, type EmailTheme } from './theme.js';
import { createPrimitives, type EmailNode, type TextRun, type TextRunText } from './primitives/nodes.js';

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

/** The schemes a url value may carry: a page, or an address to write to. A `javascript:` link runs in a webmail tab. */
const LINK_SCHEME = /^(?:https?:|mailto:)/i;

/** A lone surrogate, which `encodeURIComponent` throws on; a value is a person's text and may hold one. */
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

const NO_LINK: RenderedBlock = { html: '', text: '' };

/** The schemes an image may load from: a page; a mail address is a link only. */
const IMAGE_SCHEME = /^https?:/i;

/** The context one block renders through, reporting into `state.problems` under `blockId`. */
export function createRenderContext(
  state: RenderState,
  blockId: string | null,
  lane: (index: number) => readonly EmailNode[],
  laneCount = 0,
  available = CONTENT_WIDTH,
): RenderContext {
  const colors = resolveEmailTheme(state.theme).colors;
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
  const typeOf = (name: string): VariableType | undefined =>
    Object.hasOwn(state.variableTypes, name) ? state.variableTypes[name] : undefined;
  const reportMissing = (template: string): void => {
    for (const name of variableTokens(template)) {
      if (valueOf(name) === null) report('variable-missing', name);
    }
  };
  const fill = (text: string): string => interpolate(text, state.variables, 'text');
  // A link's label reads as plain runs where its href is refused, so the text survives and nothing links.
  const runs = (template: string): TextRun[] => {
    reportMissing(template);
    const parsed = parseInlineMarkup(template);
    if (!parsed.ok) return template === '' ? [] : [{ kind: 'text', text: fill(template), bold: false, italic: false }];
    const filled = (run: InlineText): TextRunText => ({ ...run, text: fill(run.text) });
    return parsed.runs.flatMap((run): TextRun[] => {
      if (run.kind === 'text') return [filled(run)];
      const label = run.label.map(filled);
      const link = context.href(run.href);
      return link.html === '' ? label : [{ kind: 'link', href: link.text, label }];
    });
  };
  const drawText = (run: TextRunText): RenderedBlock => {
    let html = escapeHtml(run.text);
    if (run.italic) html = `<em>${html}</em>`;
    if (run.bold) html = `<strong>${html}</strong>`;
    const classes = [
      ...(run.color === undefined || run.color === 'default'
        ? []
        : [[`zx-color-${run.color}`, `color:${textColorOf(run.color, colors)};`]]),
      ...(run.background === undefined || run.background === 'default'
        ? []
        : [[`zx-bg-${run.background}`, `background:${surfaceColorOf(run.background, colors)};`]]),
    ];
    if (classes.length > 0) {
      const names = classes.map(([name]) => name).join(' ');
      html = `<span class="${names}" style="${classes.map(([, style]) => style).join('')}">${html}</span>`;
    }
    return { html, text: run.text };
  };
  const context: RenderContext = {
    theme: state.theme,
    locale: state.locale,
    region: state.region,
    available,
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
      const trimmed = template.trim();
      const name = leadingToken(trimmed);
      if (hrefProblem(trimmed, typeOf) !== null) {
        report('href-invalid', name);
        return NO_LINK;
      }
      let head = '';
      let rest = trimmed;
      // Filled as it is, so the value supplies the scheme, which is why only a url value may lead.
      if (name !== undefined) {
        const value = valueOf(name);
        if (value === null) {
          report('variable-missing', name);
          return NO_LINK;
        }
        if (!LINK_SCHEME.test(value.trim())) {
          report('href-scheme-refused', name);
          return NO_LINK;
        }
        head = value;
        rest = trimmed.slice(`{{${name}}}`.length);
      }
      // Encoded, so a value holding `&`, `?`, `#` or a space stays one part of the link and changes no other.
      const tail = rest.replace(VARIABLE_TOKEN, (_token, inner: string) => {
        const value = valueOf(inner);
        if (value === null) report('variable-missing', inner);
        return encodeURIComponent((value ?? '').replace(LONE_SURROGATE, '\uFFFD'));
      });
      const href = head + tail;
      return { html: escapeHtml(href), text: href };
    },
    inline(template): RenderedBlock {
      const parts = runs(template).map((run): RenderedBlock => {
        if (run.kind === 'text') return drawText(run);
        const label = run.label.map(drawText);
        return {
          html: `<a href="${escapeHtml(run.href)}" class="zx-link" style="color:${state.theme.colors.primary};">${label.map((part) => part.html).join('')}</a>`,
          text: `${label.map((part) => part.text).join('')} (${run.href})`,
        };
      });
      return { html: parts.map((part) => part.html).join(''), text: parts.map((part) => part.text).join('') };
    },
    h: createPrimitives({
      text: (template) => context.text(template),
      runs: (template) => runs(template),
      href: (template) => {
        const link = context.href(template);
        return link.html === '' ? null : link.text;
      },
      markup: (template) => context.markup(template),
      imageSrc: (template) => {
        const link = context.href(template);
        return link.html !== '' && IMAGE_SCHEME.test(link.text) ? link.text : null;
      },
    }),
    lane,
    laneCount,
  };
  return context;
}
