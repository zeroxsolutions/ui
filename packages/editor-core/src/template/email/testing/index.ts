import { escapeHtml } from '../../variables/interpolate.js';
import { variableTokens } from '../../variables/variable-tokens.js';
import type { EmailBlock } from '../block.js';
import { REGIONS, type Region } from '../region.js';
import type { StylesheetWarning } from '../css/unsupported.js';
import type { EmailRenderer, RenderedEmail } from '../renderer.js';

/** One rule a renderer broke, on one block type. */
export interface BlockConformanceFailure {
  readonly type: string;
  readonly problem: 'value-unescaped' | 'text-empty' | 'href-foreign' | 'render-threw';
  readonly detail?: string;
  /** The region the rule broke in; absent where it broke in the body. */
  readonly region?: Region;
}

/** A declaration of the renderer's `css` that common mail clients drop. */
export interface StylesheetConformanceFailure {
  readonly problem: 'stylesheet-unsupported';
  readonly warning: StylesheetWarning;
}

export type ConformanceFailure = BlockConformanceFailure | StylesheetConformanceFailure;

/** A value that is markup if printed raw, and the url every link in a probe render must be. */
const PROBE = '<b data-probe="1">&"\'</b>';
const PROBE_URL = 'https://probe.invalid/path?a=1&b=2';

/** Every token a sample spells, its content and its lanes' content both. */
function sampleTokens(content: unknown, lanes: readonly (readonly EmailBlock[])[] | undefined): string[] {
  return [...variableTokens(content), ...(lanes ?? []).flat().flatMap((block) => variableTokens(block.content))];
}

/**
 * What a renderer gets wrong that a product cannot see in its own mail: a value printed raw, a block with no
 * text twin, a link not taken from a url variable, a render that throws, CSS that common clients drop. It
 * renders every type the renderer knows from that type's sample, once in the body and once in each region,
 * each value a piece of markup, and answers each rule broken, then each stylesheet warning; `[]` conforms.
 * What a block looks like is not checked: that is the product's at level 2.
 */
export function checkEmailRenderer<Type extends string, Props>(
  renderer: EmailRenderer<Type, Props>,
  options: { readonly layoutProps: Props },
): ConformanceFailure[] {
  const failures: ConformanceFailure[] = [];
  for (const type of renderer.types) {
    const sample = renderer.sample(type);
    const variables: Record<string, string> = { probe_subject: PROBE };
    for (const name of sampleTokens(sample.content, sample.lanes)) {
      variables[name] = sample.variableTypes[name] === 'url' ? PROBE_URL : PROBE;
    }
    const block: EmailBlock = {
      id: `probe-${type}`,
      type,
      attributes: sample.attributes,
      content: sample.content,
      ...(sample.lanes === undefined ? {} : { lanes: sample.lanes }),
    };
    for (const place of ['body', ...REGIONS] as const) {
      const where = place === 'body' ? {} : { region: place };
      const probeVariableTypes = { ...sample.variableTypes, probe_subject: 'string' as const };
      let rendered: RenderedEmail;
      try {
        rendered = renderer.render({
          blocks: place === 'body' ? [block] : [],
          // The subject and preheader are the layout's to escape, so only the body place probes them; a
          // region place probing them too would blame a region for the layout's fault.
          subject: place === 'body' ? 'Probe {{probe_subject}}' : 'Probe',
          preheader: place === 'body' ? 'Probe {{probe_subject}}' : 'Probe',
          locale: 'en',
          variables,
          variableTypes: probeVariableTypes,
          layoutProps: options.layoutProps,
          ...(place === 'body'
            ? {}
            : { regions: { [place]: { blocks: [block], variables, variableTypes: probeVariableTypes } } }),
        });
      } catch (error) {
        failures.push({
          type,
          problem: 'render-threw',
          detail: error instanceof Error ? error.message : String(error),
          ...where,
        });
        continue;
      }
      if (rendered.html.includes(PROBE)) failures.push({ type, problem: 'value-unescaped', ...where });
      if (renderer.holdsText(type) && !rendered.text.includes(PROBE) && !rendered.text.includes(PROBE_URL)) {
        failures.push({ type, problem: 'text-empty', ...where });
      }
      for (const [, href] of rendered.html.matchAll(/href="([^"]*)"/g)) {
        if (href !== '' && href !== escapeHtml(PROBE_URL))
          failures.push({ type, problem: 'href-foreign', detail: href, ...where });
      }
    }
  }
  for (const warning of renderer.stylesheetWarnings) failures.push({ problem: 'stylesheet-unsupported', warning });
  return failures;
}
