import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Text } from './text';

function renderCard(size?: 'default' | 'sm') {
  return render(
    <Card size={size} testID="card">
      <CardHeader testID="header">
        <CardTitle>Plan</CardTitle>
        <CardDescription>Billed monthly</CardDescription>
      </CardHeader>
      <CardContent testID="content">
        <Text>Body</Text>
      </CardContent>
      <CardFooter testID="footer">
        <Text>Footer</Text>
      </CardFooter>
    </Card>,
  );
}

describe('Card', () => {
  it("is a rounded card surface with Vega's default spacing", async () => {
    await renderCard();

    expect(emittedClasses(screen.getByTestId('card').props.className)).toEqual(
      expect.arrayContaining(['rounded-xl', 'bg-card', 'overflow-hidden', 'gap-6', 'py-6']),
    );
    expect(emittedClasses(screen.getByTestId('header').props.className)).toEqual(
      expect.arrayContaining(['gap-1', 'px-6']),
    );
    expect(emittedClasses(screen.getByTestId('content').props.className)).toContain('px-6');
    expect(emittedClasses(screen.getByTestId('footer').props.className)).toEqual(
      expect.arrayContaining(['px-6', 'rounded-b-xl']),
    );
  });

  it('tightens its own and every part spacing to 16px at size sm', async () => {
    await renderCard('sm');

    const card = emittedClasses(screen.getByTestId('card').props.className);
    expect(card).toEqual(expect.arrayContaining(['gap-4', 'py-4']));
    expect(card).not.toContain('gap-6');
    for (const part of ['header', 'content', 'footer']) {
      const classes = emittedClasses(screen.getByTestId(part).props.className);
      expect(classes).toContain('px-4');
      expect(classes).not.toContain('px-6');
    }
  });

  it('draws the title as a heading and the description muted', async () => {
    await renderCard();

    const title = screen.getByRole('heading', { name: 'Plan' });
    expect(emittedClasses(title.props.className)).toEqual(
      expect.arrayContaining(['text-base', 'leading-normal', 'font-sans-medium']),
    );
    expect(emittedClasses(screen.getByText('Billed monthly').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm']),
    );
  });

  it('draws the title at text-sm at size sm', async () => {
    await renderCard('sm');

    const classes = emittedClasses(screen.getByRole('heading', { name: 'Plan' }).props.className);

    expect(classes).toContain('text-sm');
    expect(classes).not.toContain('text-base');
  });

  it("hands the text inside the card's foreground colour", async () => {
    await renderCard();

    expect(emittedClasses(screen.getByText('Body').props.className)).toContain('text-card-foreground');
  });
});
