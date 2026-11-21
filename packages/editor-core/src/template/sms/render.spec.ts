// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderSms } from './render.js';

describe('renderSms', () => {
  it('fills a placeholder on the text arm, leaving markup as it is', () => {
    expect(renderSms('Code {{code}} <b>', { code: '123456' })).toEqual({
      text: 'Code 123456 <b>',
      measure: { encoding: 'gsm7', units: 15 },
      fitsOneSegment: true,
      missing: [],
    });
  });

  it('names a token the send holds no value for, once each, whether absent or held null', () => {
    expect(renderSms('{{code}} {{code}} {{name}}', { name: null }).missing).toEqual(['code', 'name']);
  });

  it('names no token a send holds a value for, even one it never uses', () => {
    expect(renderSms('{{code}}', { code: '123456', otp: '999999' }).missing).toEqual([]);
  });

  it('measures what it rendered, so a value that pushes the text one unit past a segment is caught', () => {
    // 148 characters and `{{code}}`, twelve GSM-7 units, fit on write; a twelve-character value renders
    // 160 units and a thirteen-character one 161.
    const body = `${'a'.repeat(148)}{{code}}`;

    expect(renderSms(body, { code: '1'.repeat(12) }).fitsOneSegment).toBe(true);
    expect(renderSms(body, { code: '1'.repeat(13) }).fitsOneSegment).toBe(false);
  });
});
