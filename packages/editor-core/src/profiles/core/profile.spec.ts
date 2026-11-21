import { describe, expect, it } from 'vitest';
import { EditorError } from '../../document/core/errors.js';
import { emailProfile, MAIL_LAYOUT_KINDS, smsProfile } from './profile.js';

describe('emailProfile', () => {
  it('allows all eight kinds with the house bounds and exports', () => {
    const profile = emailProfile();
    expect(profile.id).toBe('email');
    expect(profile.kinds).toEqual(['paragraph', 'button', 'code', 'list', 'callout', 'divider', 'columns', 'html']);
    expect(profile.exports).toEqual(['email-blocks', 'email-html', 'email-text']);
    expect(profile.bounds).toEqual({
      text: 5000,
      label: 200,
      href: 2000,
      listItems: 20,
      blocks: 50,
      lanes: 4,
      variables: 20,
    });
  });

  it('narrows to the mail-layout kinds', () => {
    expect(emailProfile({ allow: MAIL_LAYOUT_KINDS }).kinds).toEqual([
      'paragraph',
      'list',
      'callout',
      'divider',
      'columns',
    ]);
  });

  it('refuses an unknown kind', () => {
    expect(() => emailProfile({ allow: ['marquee' as never] })).toThrow(EditorError);
  });

  it('appends extra kinds and overrides bounds', () => {
    const profile = emailProfile({ extraKinds: ['emailPoll'], bounds: { blocks: 10 } });
    expect(profile.kinds.at(-1)).toBe('emailPoll');
    expect(profile.bounds.blocks).toBe(10);
  });

  it('refuses a duplicate variable name', () => {
    const v = { name: 'a', type: 'string' as const };
    expect(() => emailProfile({ variables: [v, v] })).toThrow(/twice/);
  });

  it('refuses a name that is not \\w+ or is over 64 characters', () => {
    expect(() => emailProfile({ variables: [{ name: 'a-b', type: 'string' }] })).toThrow(EditorError);
    expect(() => emailProfile({ variables: [{ name: 'a'.repeat(65), type: 'string' }] })).toThrow(EditorError);
    expect(emailProfile({ variables: [{ name: 'a'.repeat(64), type: 'string' }] }).variables).toHaveLength(1);
  });

  it('refuses more declarations than bounds.variables', () => {
    const variables = Array.from({ length: 3 }, (_, i) => ({ name: `v${i}`, type: 'string' as const }));
    expect(() => emailProfile({ variables, bounds: { variables: 2 } })).toThrow(EditorError);
  });
});

describe('smsProfile', () => {
  it('has no block kinds, one segment and the sms export', () => {
    const profile = smsProfile();
    expect(profile.id).toBe('sms');
    expect(profile.kinds).toEqual([]);
    expect(profile.maxSegments).toBe(1);
    expect(profile.exports).toEqual(['sms-text']);
  });

  it('validates its declarations', () => {
    const v = { name: 'a', type: 'string' as const };
    expect(() => smsProfile({ variables: [v, v] })).toThrow(EditorError);
    expect(smsProfile({ maxSegments: 3 }).maxSegments).toBe(3);
  });
});
