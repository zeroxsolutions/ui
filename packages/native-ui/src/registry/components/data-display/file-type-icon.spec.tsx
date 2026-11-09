import { render, screen } from '@testing-library/react-native';
import { File, FileArchive, FileCode, FileImage, FileJson, FileText, FileType } from 'lucide-react-native';
import { fileTypeIcon } from '../../lib/file-type';
import { FileTypeIcon } from './file-type-icon';

const HIDDEN = { includeHiddenElements: true } as const;

describe('fileTypeIcon', () => {
  it.each([
    ['run.py', FileCode],
    ['logo.png', FileImage],
    ['Inter.woff2', FileType],
    ['notes.md', FileText],
    ['archive.zip', FileArchive],
    ['package.json', FileJson],
    ['src/LOGO.PNG', FileImage],
    ['C:\\docs\\read.me.TXT', FileText],
    ['Makefile', File],
    ['.env', File],
    ['data.unknown', File],
  ])('maps %s to its icon', (name, icon) => {
    expect(fileTypeIcon(name)).toBe(icon);
  });
});

describe('FileTypeIcon', () => {
  it('draws the icon its extension maps to, hidden from a screen reader', async () => {
    await render(<FileTypeIcon name="logo.png" testID="icon" />);

    const icon = screen.getByTestId('icon', HIDDEN);
    expect(icon).toBeOnTheScreen();
    expect(screen.queryByRole('img')).toBeNull();
    expect(icon.props['aria-hidden']).toBe(true);
  });

  it('is an image named by its aria-label when it stands alone', async () => {
    await render(<FileTypeIcon name="run.py" aria-label="Python file" />);

    expect(screen.getByRole('img', { name: 'Python file' })).toBeOnTheScreen();
  });
});
