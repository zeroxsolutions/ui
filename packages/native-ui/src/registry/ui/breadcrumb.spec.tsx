import { render, screen, userEvent } from '@testing-library/react-native';
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

  it('calls onPress when a link is pressed', async () => {
    const onHome = jest.fn();
    await renderTrail(onHome);

    await userEvent.setup().press(screen.getByRole('link', { name: 'Home' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('marks the current page as the current, disabled link', async () => {
    await renderTrail();

    const page = screen.getByRole('link', { name: 'Settings' });
    expect(page.props['aria-current']).toBe('page');
    expect(page.props['aria-disabled']).toBe(true);
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
