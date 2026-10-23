import { render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';
import { DirectionProvider } from './direction';
import { holdsMirrored } from './direction.testing';
import { Text } from './text';

function renderPages(onPage = jest.fn()) {
  return render(
    <Pagination testID="nav">
      <PaginationContent testID="content">
        <PaginationItem>
          <PaginationPrevious onPress={() => onPage('previous')} testID="previous" />
        </PaginationItem>
        <PaginationItem testID="item">
          <PaginationLink onPress={() => onPage(1)}>
            <Text>1</Text>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>
            <Text>2</Text>
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis testID="ellipsis" />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext onPress={() => onPage('next')} testID="next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>,
  );
}

describe('Pagination', () => {
  it('is a navigation landmark named Pagination holding a list of pages', async () => {
    await renderPages();

    const nav = screen.getByTestId('nav');
    expect(nav.props.role).toBe('navigation');
    expect(nav.props['aria-label']).toBe('Pagination');
    expect(screen.getByTestId('content').props.role).toBe('list');
    expect(screen.getByTestId('item').props.role).toBe('listitem');
    expect(emittedClasses(screen.getByTestId('content').props.className)).toEqual(
      expect.arrayContaining(['flex-row', 'items-center', 'gap-1']),
    );
  });

  it('draws each page as a ghost icon-sized link, and the current page outlined and marked', async () => {
    await renderPages();

    const page = screen.getByRole('link', { name: '1' });
    const current = screen.getByRole('link', { name: '2' });
    expect(emittedClasses(page.props.className)).toEqual(expect.arrayContaining(['size-9']));
    expect(emittedClasses(page.props.className)).not.toContain('border-border');
    expect(emittedClasses(current.props.className)).toContain('border-border');
    expect(current.props['aria-current']).toBe('page');
    expect(page.props['aria-current']).toBeUndefined();
    expect(current).toBeSelected();
    expect(page).not.toBeSelected();
  });

  it('calls onPress of the page pressed', async () => {
    const onPage = jest.fn();
    await renderPages(onPage);
    const user = userEvent.setup();

    await user.press(screen.getByRole('link', { name: '1' }));
    await user.press(screen.getByRole('link', { name: 'Go to next page' }));

    expect(onPage.mock.calls).toEqual([[1], ['next']]);
  });

  it('names the previous and next links and tightens their outer padding', async () => {
    await renderPages();

    expect(screen.getByRole('link', { name: 'Go to previous page' })).toBeOnTheScreen();
    const previous = emittedClasses(screen.getByTestId('previous').props.className);
    expect(previous).toEqual(expect.arrayContaining(['h-9', 'pl-2']));
    expect(emittedClasses(screen.getByTestId('next').props.className)).toContain('pr-2');
    expect(emittedClasses(screen.getByTestId('next').props.className, 'nova')).toContain('pr-1.5');
  });

  it('mirrors the previous and next chevrons when text reads right to left, and only then', async () => {
    await renderPages();
    expect(holdsMirrored(screen.getByTestId('previous'))).toBe(false);
    expect(holdsMirrored(screen.getByTestId('next'))).toBe(false);

    await render(
      <DirectionProvider direction="rtl">
        <PaginationPrevious testID="rtl-previous" />
        <PaginationNext testID="rtl-next" />
      </DirectionProvider>,
    );

    expect(holdsMirrored(screen.getByTestId('rtl-previous'))).toBe(true);
    expect(holdsMirrored(screen.getByTestId('rtl-next'))).toBe(true);
  });

  it('hides the ellipsis from screen readers', async () => {
    await renderPages();

    expect(screen.getByTestId('ellipsis', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.queryByTestId('ellipsis')).not.toBeOnTheScreen();
  });
});
