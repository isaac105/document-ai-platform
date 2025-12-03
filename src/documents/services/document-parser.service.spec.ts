import { DocumentParserService } from './document-parser.service';

describe('DocumentParserService', () => {
  let service: DocumentParserService;

  beforeEach(() => {
    service = new DocumentParserService();
  });

  it('지원하는 mimeType 또는 확장자이면 true 를 반환한다', () => {
    expect(
      service.isValidFileType(
        'application/pdf',
        '회사소개서.pdf',
      ),
    ).toBe(true);

    expect(
      service.isValidFileType(
        'application/octet-stream',
        'notes.txt',
      ),
    ).toBe(true);
  });

  it('지원하지 않는 타입/확장자는 false 를 반환한다', () => {
    expect(
      service.isValidFileType(
        'image/png',
        'image.png',
      ),
    ).toBe(false);
  });
});


