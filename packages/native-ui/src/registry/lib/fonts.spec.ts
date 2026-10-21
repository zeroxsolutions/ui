import { zuiFonts } from './fonts';

describe('zuiFonts', () => {
  it('keeps the family names it was declared with as its keys', () => {
    const names: readonly (keyof typeof zuiFonts)[] = [
      'Geist_400Regular',
      'Geist_500Medium',
      'Geist_600SemiBold',
      'Geist_700Bold',
    ];
    // @ts-expect-error a name the theme does not declare is not a key
    const unknown: keyof typeof zuiFonts = 'Geist_900Black';

    expect(Object.keys(zuiFonts).sort()).toEqual([...names].sort());
    expect(unknown).toBe('Geist_900Black');
  });
});
