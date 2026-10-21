import { render, screen } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Badge, badgeVariants } from './badge';
import { Icon } from './icon';
import { Text } from './text';

describe('Badge', () => {
  it("is a pill in Vega's primary colours by default", async () => {
    await render(
      <Badge testID="badge">
        <Text>New</Text>
      </Badge>,
    );

    expect(emittedClasses(screen.getByTestId('badge').props.className)).toEqual(
      expect.arrayContaining(['rounded-4xl', 'bg-primary']),
    );
    expect(emittedClasses(screen.getByText('New').props.className)).toEqual(
      expect.arrayContaining(['text-primary-foreground', 'text-xs', 'font-sans-medium']),
    );
  });

  it.each([
    ['secondary', 'bg-secondary', 'text-secondary-foreground'],
    ['destructive', 'bg-destructive/10', 'text-destructive'],
    ['outline', 'border-border', 'text-foreground'],
  ] as const)('switches to the %s colours', async (variant, background, foreground) => {
    await render(
      <Badge variant={variant} testID="badge">
        <Text>New</Text>
      </Badge>,
    );
    const classes = emittedClasses(screen.getByTestId('badge').props.className);

    expect(classes).toContain(background);
    expect(classes).not.toContain('bg-primary');
    expect(emittedClasses(screen.getByText('New').props.className)).toContain(foreground);
  });

  it('draws ghost with no background and link in the primary text colour', async () => {
    await render(
      <>
        <Badge variant="ghost" testID="ghost">
          <Text>Ghost</Text>
        </Badge>
        <Badge variant="link">
          <Text>Link</Text>
        </Badge>
      </>,
    );

    expect(emittedClasses(screen.getByTestId('ghost').props.className)).not.toContain('bg-primary');
    expect(emittedClasses(screen.getByText('Link').props.className)).toContain('text-primary');
  });

  it('exposes the variant recipe for a caller that styles a pressable as a badge', () => {
    expect(emittedClasses(badgeVariants({ variant: 'secondary' }))).toContain('bg-secondary');
  });

  it('sizes an Icon inside to 12px', async () => {
    registerCSS('.size-3 { width: 12px; height: 12px; }');
    await render(
      <Badge>
        <Icon as={Check} accessible role="img" aria-label="Done" />
      </Badge>,
    );

    const { width, height } = screen.getByRole('img', { name: 'Done' }).props;

    expect({ width, height }).toEqual({ width: 12, height: 12 });
  });
});
