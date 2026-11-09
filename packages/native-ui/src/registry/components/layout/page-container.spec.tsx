import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { PageContainer } from './page-container';

describe('PageContainer', () => {
  it('centres a full-width column capped at max-w-5xl by default', async () => {
    await render(
      <PageContainer testID="page">
        <Text>Account settings</Text>
      </PageContainer>,
    );

    expect(screen.getByText('Account settings')).toBeOnTheScreen();
    expect(emittedClasses(screen.getByTestId('page').props.className)).toEqual(
      expect.arrayContaining(['mx-auto', 'w-full', 'max-w-5xl']),
    );
  });

  it.each([
    ['sm', 'max-w-3xl'],
    ['md', 'max-w-5xl'],
    ['lg', 'max-w-7xl'],
    ['full', 'max-w-none'],
  ] as const)('caps the %s column at %s', async (size, width) => {
    await render(<PageContainer testID="page" size={size} />);

    const classes = emittedClasses(screen.getByTestId('page').props.className);
    expect(classes.filter((name) => name.startsWith('max-w-'))).toEqual([width]);
  });

  it("takes the surface's padding from className", async () => {
    await render(<PageContainer testID="page" className="px-6 py-6" />);

    expect(emittedClasses(screen.getByTestId('page').props.className)).toEqual(
      expect.arrayContaining(['px-6', 'py-6']),
    );
  });
});
