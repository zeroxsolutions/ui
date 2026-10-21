import { demos as novaDemos } from '@styles/nova/examples';

import { DEMO_NAMES, findDemo } from './find-demo';

describe('findDemo', () => {
  it.each(['vega', 'nova'] as const)('finds each demo by its name in %s', (style) => {
    for (const name of DEMO_NAMES) expect(findDemo(style, name)).toBeDefined();
  });

  it("draws each style's own copy of a demo", () => {
    expect(findDemo('nova', 'button-demo')).toBe(novaDemos['button-demo']);
    expect(findDemo('vega', 'button-demo')).not.toBe(novaDemos['button-demo']);
  });

  it('finds nothing for a name the list lacks', () => {
    expect(findDemo('vega', 'carousel-demo')).toBeUndefined();
  });

  it('finds nothing for a name every object inherits, so a link to it shows the missing demo', () => {
    expect(findDemo('nova', 'constructor')).toBeUndefined();
    expect(findDemo('nova', 'toString')).toBeUndefined();
  });
});

describe('DEMO_NAMES', () => {
  it('lists the demos every style draws', () => {
    expect(DEMO_NAMES).toEqual(Object.keys(novaDemos));
  });
});
