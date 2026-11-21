import { interpolate } from '../variables/interpolate.js';
import { fitsOneSmsSegment, measureSms, type SmsMeasure } from './measure.js';
import { variableTokens } from '../variables/variable-tokens.js';
import type { Variables } from '../variables/variables.js';

/** One SMS as a delivery sends it, what it costs, and whether it still fits the one segment its pattern was registered at. */
export interface RenderedSms {
  text: string;
  measure: SmsMeasure;
  fitsOneSegment: boolean;
  /**
   * Every token name the body spells, once each, that `variables` holds no value for: absent from the
   * record, or held as `null`. `interpolate` fills either the same way, with an empty string, so
   * without this a send goes out billed and accepted with a blank where a value belongs.
   */
  missing: string[];
}

/**
 * Fills an SMS template's body from a send's variables on the text arm, since an SMS carries no markup, and
 * measures the result again: a write counts a placeholder as the characters it is, and a value can render
 * longer than that.
 */
export function renderSms(body: string, variables: Variables): RenderedSms {
  const text = interpolate(body, variables, 'text');
  const measure = measureSms(text);
  const missing = [...new Set(variableTokens(body))].filter(
    (name) => variables[name] === undefined || variables[name] === null,
  );
  return { text, measure, fitsOneSegment: fitsOneSmsSegment(measure), missing };
}
