import { describe, expect, it } from 'vitest';
import { acceptScore, acceptsFile, DEFAULT_UPLOAD_MESSAGES, uploadRefusal } from './upload';

const file = (name: string, type: string, bytes = 1): File => new File([new Uint8Array(bytes)], name, { type });

describe('acceptsFile', () => {
  it('takes a file by its type, its group or its extension, and any file for an empty list', () => {
    expect(acceptsFile('image/png', file('a.png', 'image/png'))).toBe(true);
    expect(acceptsFile('image/*', file('a.jpg', 'image/jpeg'))).toBe(true);
    expect(acceptsFile('.pdf, image/*', file('Plan.PDF', 'application/pdf'))).toBe(true);
    expect(acceptsFile('', file('a.zip', 'application/zip'))).toBe(true);
    expect(acceptsFile('video/*,audio/*', file('a.png', 'image/png'))).toBe(false);
  });
});

describe('acceptScore', () => {
  it('ranks the type itself over its group over any file', () => {
    const png = file('a.png', 'image/png');
    expect(acceptScore('image/png', png)).toBe(3);
    expect(acceptScore('image/*', png)).toBe(2);
    expect(acceptScore('', png)).toBe(1);
    expect(acceptScore('video/*', png)).toBe(0);
  });
});

describe('uploadRefusal', () => {
  it("refuses a type outside the block's or the host's list, and a file over the cap", () => {
    const png = file('a.png', 'image/png', 2048);
    expect(uploadRefusal(png, 'image/*', {}, DEFAULT_UPLOAD_MESSAGES)).toBeNull();
    expect(uploadRefusal(png, 'video/*', {}, DEFAULT_UPLOAD_MESSAGES)).toBe(DEFAULT_UPLOAD_MESSAGES.notAccepted);
    expect(uploadRefusal(png, 'image/*', { accept: 'image/jpeg' }, DEFAULT_UPLOAD_MESSAGES)).toBe(
      DEFAULT_UPLOAD_MESSAGES.notAccepted,
    );
    expect(uploadRefusal(png, 'image/*', { maxBytes: 1024 }, DEFAULT_UPLOAD_MESSAGES)).toBe(
      'The file is larger than 1 KB',
    );
  });
});
