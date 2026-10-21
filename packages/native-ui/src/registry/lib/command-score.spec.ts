import { commandScore } from './command-score';

describe('commandScore', () => {
  it('scores an exact match 1', () => {
    expect(commandScore('Calendar', 'Calendar')).toBe(1);
  });

  it('scores letters the value holds in order, with gaps between them, above 0', () => {
    expect(commandScore('Calendar', 'clndr')).toBeGreaterThan(0);
  });

  it('scores 0 when the value does not hold the letters in order', () => {
    expect(commandScore('Calendar', 'zz')).toBe(0);
    expect(commandScore('Calendar', 'rdc')).toBe(0);
  });

  it('scores a match at the start of a word above one inside it', () => {
    expect(commandScore('Search Emoji', 'emo')).toBeGreaterThan(commandScore('Lemonade', 'emo'));
  });

  it('matches against the keywords as well', () => {
    expect(commandScore('Search Emoji', 'smiley', ['smiley'])).toBeGreaterThan(0);
  });

  it('forgives two letters typed the wrong way round', () => {
    expect(commandScore('Calendar', 'clanedar')).toBeGreaterThan(0);
  });
});
