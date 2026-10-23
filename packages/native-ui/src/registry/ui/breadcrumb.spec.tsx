import { render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';
import { DirectionProvider } from './direction';
import { holdsMirrored } from './direction.testing';
import { Text } from './text';

function renderTrail(onHome = jest.fn()) {
  return render(
    <Breadcrumb testID="nav">
      <BreadcrumbList testID="list">
        <BreadcrumbItem testID="item">
          <BreadcrumbLink onPress={onHome}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator testID="separator" />
        <BreadcrumbItem>
          <BreadcrumbEllipsis testID="ellipsis" />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
}

describe('Breadcrumb', () => {
  it('is a navigation landmark named Breadcrumb holding a list of items', async () => {
    await renderTrail();

    const nav = screen.getByTestId('nav');
    expect(nav.props.role).toBe('navigation');
    expect(nav.props['aria-label']).toBe('Breadcrumb');
    expect(screen.getByTestId('list').props.role).toBe('list');
    expect(screen.getByTestId('item').props.role).toBe('listitem');
  });

  it('lays the trail out in a wrapping row of muted small text', async () => {
    await renderTrail();

    expect(emittedClasses(screen.getByTestId('list').props.className)).toEqual(
      expect.arrayContaining(['flex-row', 'flex-wrap', 'items-center', 'gap-1.5']),
    );
    expect(emittedClasses(screen.getByText('Home').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm']),
    );
    expect(emittedClasses(screen.getByTestId('item').props.className, 'nova')).toContain('gap-1');
  });

  it('calls onPress when a link is pressed', async () => {
    const onHome = jest.fn();
    await renderTrail(onHome);

    await userEvent.setup().press(screen.getByRole('link', { name: 'Home' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('marks the current page as the current, disabled link in the foreground colour', async () => {
    await renderTrail();

    const page = screen.getByRole('link', { name: 'Settings' });
    expect(page.props['aria-current']).toBe('page');
    expect(page.props['aria-disabled']).toBe(true);
    expect(emittedClasses(page.props.className)).toContain('text-foreground');
    expect(emittedClasses(page.props.className)).not.toContain('text-muted-foreground');
  });

  it('hides the separators and the ellipsis from screen readers', async () => {
    await renderTrail();

    for (const testID of ['separator', 'ellipsis']) {
      expect(screen.getByTestId(testID, { includeHiddenElements: true })).toBeOnTheScreen();
      expect(screen.queryByTestId(testID)).not.toBeOnTheScreen();
    }
    expect(screen.queryAllByRole('link')).toHaveLength(2);
  });

  it('mirrors the chevron between steps when text reads right to left, and only then', async () => {
    await renderTrail();
    expect(holdsMirrored(screen.getByTestId('separator', { includeHiddenElements: true }))).toBe(false);

    await render(
      <DirectionProvider direction="rtl">
        <BreadcrumbSeparator testID="rtl-separator" />
      </DirectionProvider>,
    );

    expect(holdsMirrored(screen.getByTestId('rtl-separator', { includeHiddenElements: true }))).toBe(true);
  });

  it('draws a separator given as children in place of the chevron', async () => {
    await render(
      <BreadcrumbSeparator>
        <Text>/</Text>
      </BreadcrumbSeparator>,
    );

    expect(screen.getByText('/', { includeHiddenElements: true })).toBeOnTheScreen();
  });
});
