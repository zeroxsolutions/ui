import { demos } from '@zeroxsolutions/native-ui/examples';

import { findDemo } from './find-demo';

describe('findDemo', () => {
  it('finds each demo the web export draws by its name', () => {
    for (const [name, Demo] of Object.entries(demos)) expect(findDemo(name)).toBe(Demo);
  });

  it('finds nothing for a name the list lacks', () => {
    expect(findDemo('carousel-demo')).toBeUndefined();
  });

  it('finds nothing for a name every object inherits, so a link to it shows the missing demo', () => {
    expect(findDemo('constructor')).toBeUndefined();
    expect(findDemo('toString')).toBeUndefined();
  });
});
