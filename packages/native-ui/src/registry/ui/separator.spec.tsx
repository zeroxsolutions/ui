import { render, screen } from '@testing-library/react-native';
import { Separator } from './separator';

describe('Separator', () => {
  it('is a horizontal separator by default', async () => {
    await render(<Separator decorative={false} testID="rule" />);
    const rule = screen.getByTestId('rule');

    expect(rule.props.role).toBe('separator');
    expect(rule.props['aria-orientation']).toBe('horizontal');
  });

  it('is announced vertical when vertical', async () => {
    await render(<Separator orientation="vertical" decorative={false} testID="rule" />);

    expect(screen.getByTestId('rule').props['aria-orientation']).toBe('vertical');
  });

  it('is hidden from assistive technology by default, as it only decorates', async () => {
    await render(<Separator testID="rule" />);
    const rule = screen.getByTestId('rule', { includeHiddenElements: true });

    expect(rule.props.role).toBe('presentation');
    expect(rule.props['aria-hidden']).toBe(true);
  });
});
