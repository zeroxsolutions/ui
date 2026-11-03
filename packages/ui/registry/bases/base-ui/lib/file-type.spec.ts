import { File, FileCode, FileImage, FileText, FileType } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { fileTypeIcon } from './file-type';

describe('fileTypeIcon', () => {
  it('maps a file name to the icon of its extension', () => {
    expect(fileTypeIcon('run.py')).toBe(FileCode);
    expect(fileTypeIcon('logo.png')).toBe(FileImage);
    expect(fileTypeIcon('Inter.woff2')).toBe(FileType);
    expect(fileTypeIcon('README.md')).toBe(FileText);
  });

  it('reads the extension case-insensitively, off the last segment of a path', () => {
    expect(fileTypeIcon('assets/LOGO.PNG')).toBe(FileImage);
    expect(fileTypeIcon('C:\\docs\\notes.md')).toBe(FileText);
    expect(fileTypeIcon('v1.2/Makefile')).toBe(File);
  });

  it('treats a leading dot as part of the name, not an extension', () => {
    expect(fileTypeIcon('.env')).toBe(File);
  });

  it('falls back to the generic file icon for no or an unlisted extension', () => {
    expect(fileTypeIcon('Dockerfile')).toBe(File);
    expect(fileTypeIcon('model.onnx')).toBe(File);
  });
});
