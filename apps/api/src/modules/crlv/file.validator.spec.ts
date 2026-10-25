import { BadRequestException } from '@nestjs/common';
import { validateCrlvFile } from './file.validator.js';

function file(name: string, mimetype: string, buffer: Buffer, size = buffer.length): Express.Multer.File {
  return { originalname: name, mimetype, buffer, size } as Express.Multer.File;
}

describe('validateCrlvFile', () => {
  it.each([
    [file('doc.pdf', 'application/pdf', Buffer.from('%PDF-1.7')), 'ok'],
    [file('doc.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'ok'],
    [file('doc.png', 'image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'ok'],
    [file('doc.webp', 'image/webp', Buffer.from('RIFF0000WEBP')), 'ok'],
  ])('accepts supported signature', (upload, result) => {
    expect(() => validateCrlvFile(upload)).not.toThrow();
    expect(result).toBe('ok');
  });

  const errorCode = (upload: Express.Multer.File) => {
    try { validateCrlvFile(upload); }
    catch (error) { expect(error).toBeInstanceOf(BadRequestException); return (error as BadRequestException).getResponse(); }
    throw new Error('Expected file validation to fail');
  };
  it('rejects by size before file metadata or bytes', () => {
    expect(errorCode(file('doc.exe', 'application/x-msdownload', Buffer.alloc(1), 5_242_881))).toMatchObject({ code: 'FILE_TOO_LARGE' });
  });
  it('rejects unsupported extension before checking MIME and content', () => {
    expect(errorCode(file('doc.exe', 'image/jpeg', Buffer.from('not an image')))).toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE' });
  });
  it('rejects declared MIME mismatch before content', () => {
    expect(errorCode(file('doc.jpg', 'image/png', Buffer.from('not an image')))).toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE' });
  });
  it('rejects content mismatch', () => {
    expect(errorCode(file('doc.jpg', 'image/jpeg', Buffer.from('not an image')))).toMatchObject({ code: 'FILE_CONTENT_MISMATCH' });
  });
  it('rejects a truncated PNG signature', () => {
    expect(errorCode(file('doc.png', 'image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47])))).toMatchObject({ code: 'FILE_CONTENT_MISMATCH' });
  });
});
