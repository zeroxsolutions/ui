import { isHiddenFromAccessibility, render, screen, userEvent, within } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { CodeInput } from './code-input';

type RenderedNode = ReturnType<typeof screen.getByLabelText>;

const HIDDEN = { includeHiddenElements: true } as const;

function classNameOf(node: RenderedNode): string {
  return String(node.props.className ?? '');
}

function groups(): RenderedNode[] {
  return screen.queryAllByTestId(/^code-group-\d$/, HIDDEN);
}

function slotsOf(group: RenderedNode): RenderedNode[] {
  return within(group).queryAllByTestId(/^code-slot-\d$/, HIDDEN);
}

function separators(): RenderedNode[] {
  return screen.queryAllByTestId('code-separator', HIDDEN);
}

describe('CodeInput', () => {
  it('draws one group of six slots for pattern "6", the default', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" />);

    expect(groups()).toHaveLength(1);
    expect(slotsOf(groups()[0])).toHaveLength(6);
    expect(separators()).toHaveLength(0);
  });

  it('draws two groups of three with a separator between for pattern "3-3", still one focusable input', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" pattern="3-3" />);

    expect(groups().map((group) => slotsOf(group).length)).toEqual([3, 3]);
    expect(separators()).toHaveLength(1);
    expect(isHiddenFromAccessibility(separators()[0])).toBe(true);
    expect(screen.getAllByLabelText('Verification code')).toHaveLength(1);
  });

  it('fills the slots left to right as the code is typed', async () => {
    const onChange = jest.fn();
    await render(<CodeInput testID="code" aria-label="Verification code" pattern="3-3" onChange={onChange} />);

    await userEvent.setup().type(screen.getByLabelText('Verification code'), '123');

    const [first, second] = groups();
    expect(slotsOf(first).map((slot) => within(slot).queryByText(/^\d$/, HIDDEN)?.props.children)).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(slotsOf(second).map((slot) => within(slot).queryByText(/^\d$/, HIDDEN))).toEqual([null, null, null]);
    expect(onChange).toHaveBeenLastCalledWith('123');
  });

  it('fills all six slots from one paste of a six-digit code', async () => {
    const onChange = jest.fn();
    await render(<CodeInput testID="code" aria-label="Verification code" onChange={onChange} />);

    await userEvent.setup().paste(screen.getByLabelText('Verification code'), '123456');

    expect(screen.getAllByText(/^\d$/, HIDDEN).map((node) => node.props.children)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(onChange).toHaveBeenLastCalledWith('123456');
  });

  it('refuses characters outside the digits by default', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" />);

    await userEvent.setup().type(screen.getByLabelText('Verification code'), '1a2');

    expect(screen.getByLabelText('Verification code').props.value).toBe('12');
  });

  it('refuses characters outside allowedCharacters and takes the ones it names', async () => {
    await render(
      <CodeInput testID="code" aria-label="Verification code" allowedCharacters="^[A-Z0-9]+$" keyboardType="default" />,
    );

    await userEvent.setup().type(screen.getByLabelText('Verification code'), 'A7b-Z');

    expect(screen.getByLabelText('Verification code').props.value).toBe('A7Z');
  });

  it('marks the input invalid and draws the slots in the destructive tone', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" aria-invalid />);

    expect(screen.getByLabelText('Verification code').props['aria-invalid']).toBe(true);
    for (const slot of slotsOf(groups()[0])) {
      expect(emittedClasses(classNameOf(slot))).toContain('border-destructive');
    }
  });

  it('leaves the input valid and the slots plain without aria-invalid', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" />);

    expect(screen.getByLabelText('Verification code').props['aria-invalid']).toBeFalsy();
    for (const slot of slotsOf(groups()[0])) {
      expect(emittedClasses(classNameOf(slot))).not.toContain('border-destructive');
    }
  });

  it('lets the OS offer a texted code to the one input', async () => {
    await render(<CodeInput testID="code" aria-label="Verification code" />);

    expect(screen.getByLabelText('Verification code').props).toEqual(
      expect.objectContaining({ textContentType: 'oneTimeCode', autoComplete: 'sms-otp' }),
    );
  });

  it.each(['vega', 'nova'] as const)('makes every slot 48 square, sharing the row width, in %s', async (style) => {
    await render(<CodeInput testID="code" aria-label="Verification code" pattern="3-3" />);

    const slots = groups().flatMap(slotsOf);
    expect(slots).toHaveLength(6);
    for (const slot of slots) {
      expect(emittedClasses(classNameOf(slot), style)).toEqual(expect.arrayContaining(['size-12', 'flex-1']));
    }
  });

  it.each(['vega', 'nova'] as const)('draws each digit in text-lg and font-sans-semibold in %s', async (style) => {
    await render(<CodeInput testID="code" aria-label="Verification code" defaultValue="123456" />);

    const digits = screen.getAllByText(/^\d$/, HIDDEN);
    expect(digits).toHaveLength(6);
    for (const digit of digits) {
      const classes = emittedClasses(digit.props.className, style);
      expect(classes).toEqual(expect.arrayContaining(['text-lg', 'font-sans-semibold']));
      expect(classes).not.toContain('text-sm');
    }
  });

  it.each(['vega', 'nova'] as const)('replaces the style size of a slot with size-12 in %s', async (style) => {
    await render(<CodeInput testID="code" aria-label="Verification code" />);

    const classes = emittedClasses(classNameOf(slotsOf(groups()[0])[0]), style);
    expect(classes.filter((name) => /^(size|h|w)-/.test(name))).toEqual(['size-12']);
  });
});
