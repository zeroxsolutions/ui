import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Separator } from './separator';

describe('Separator', () => {
  it('is a horizontal rule in the border colour by default', async () => {
    await render(<Separator decorative={false} testID="rule" />);
    const rule = screen.getByTestId('rule');

    expect(rule.props.role).toBe('separator');
    expect(rule.props['aria-orientation']).toBe('horizontal');
    expect(emittedClasses(rule.props.className)).toEqual(expect.arrayContaining(['bg-border', 'h-px', 'w-full']));
  });

  it('takes the vertical slot when vertical', async () => {
    await render(<Separator orientation="vertical" decorative={false} testID="rule" />);
    const classes = emittedClasses(screen.getByTestId('rule').props.className);

    expect(classes).toEqual(expect.arrayContaining(['bg-border', 'h-full', 'w-px']));
    expect(classes).not.toContain('h-px');
    expect(screen.getByTestId('rule').props['aria-orientation']).toBe('vertical');
  });

  it('is hidden from assistive technology by default, as it only decorates', async () => {
    await render(<Separator testID="rule" />);
    const rule = screen.getByTestId('rule', { includeHiddenElements: true });

    expect(rule.props.role).toBe('presentation');
    expect(rule.props['aria-hidden']).toBe(true);
  });

  it('lets a caller class win over its own', async () => {
    await render(<Separator className="my-4" testID="rule" />);

    expect(screen.getByTestId('rule', { includeHiddenElements: true }).props.className).toContain('my-4');
  });
});
