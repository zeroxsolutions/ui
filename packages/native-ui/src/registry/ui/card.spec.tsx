import { render, screen } from '@testing-library/react-native';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Text } from './text';

describe('Card', () => {
  it('names its title as a heading for a screen reader', async () => {
    await render(
      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>Billed monthly</CardDescription>
        </CardHeader>
        <CardContent>
          <Text>Body</Text>
        </CardContent>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Plan' })).toBeOnTheScreen();
  });
});
