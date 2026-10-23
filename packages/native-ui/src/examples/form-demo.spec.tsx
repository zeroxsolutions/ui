import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FormDemo } from './form-demo';

// Upstream ships form with no files; its page binds Field to react-hook-form's Controller, which this demo
// does, so the demo is where that binding is checked.
describe('FormDemo', () => {
  const title = () => screen.getByLabelText('Bug Title');
  const description = () => screen.getByLabelText('Description');
  const submit = () => act(async () => fireEvent.press(screen.getByRole('button', { name: 'Submit' })));

  it("shows each field's error, and marks it invalid, when the report is submitted too short", async () => {
    await render(<FormDemo />);

    await fireEvent.changeText(title(), 'Bug');
    await submit();

    expect(screen.getByText('Bug title must be at least 5 characters.')).toBeOnTheScreen();
    expect(screen.getByText('Description must be at least 20 characters.')).toBeOnTheScreen();
    expect(title()).toHaveProp('aria-invalid', true);
  });

  it("clears a field's error once its value is valid and the report is submitted again", async () => {
    await render(<FormDemo />);
    await submit();

    await fireEvent.changeText(title(), 'Login button broken');
    await fireEvent.changeText(description(), 'Pressing it on a phone does nothing at all.');
    await submit();

    expect(screen.queryByText('Bug title must be at least 5 characters.')).toBeNull();
    expect(screen.queryByText('Description must be at least 20 characters.')).toBeNull();
    expect(title()).not.toHaveProp('aria-invalid', true);
  });

  it('counts the characters of the description as it is typed', async () => {
    await render(<FormDemo />);

    await fireEvent.changeText(description(), 'Twelve chars');

    expect(screen.getByText('12/100 characters')).toBeOnTheScreen();
  });
});
