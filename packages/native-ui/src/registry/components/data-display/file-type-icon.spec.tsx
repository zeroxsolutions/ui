import { render, screen } from '@testing-library/react-native';
import { File, FileImage } from 'lucide-react-native';
import { fileTypeIcon } from '../../lib/file-type';
import { FileTypeIcon } from './file-type-icon';

const HIDDEN = { includeHiddenElements: true } as const;

describe('fileTypeIcon', () => {
  it("picks the icon of a listed file's extension", () => {
    expect(fileTypeIcon('logo.png')).toBe(FileImage);
  });

  it('reads the extension whatever its case', () => {
    expect(fileTypeIcon('LOGO.PNG')).toBe(FileImage);
  });

  it('reads the name after the last separator of either kind, so a dotfile in a folder has no extension', () => {
    expect(fileTypeIcon('assets/.png')).toBe(File);
    expect(fileTypeIcon('C:\\assets\\.png')).toBe(File);
  });

  it('falls back to a generic file for a name with no extension, a dotfile, and an unlisted extension', () => {
    expect(fileTypeIcon('Makefile')).toBe(File);
    expect(fileTypeIcon('.png')).toBe(File);
    expect(fileTypeIcon('data.unknown')).toBe(File);
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
