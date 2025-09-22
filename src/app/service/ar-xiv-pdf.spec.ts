
import { TestBed } from '@angular/core/testing';
import { ArXivPdfService } from './ar-xiv-pdf';
import * as pdfjsLib from 'pdfjs-dist';

describe('ArXivPdfService', () => {
  let service: ArXivPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArXivPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should extract text and images from a PDF', async () => {
    const mockPdfDocument = {
      numPages: 1,
      getPage: async (pageNumber: number) => {
        return {
          getTextContent: async () => {
            return {
              items: [{ str: 'Hello, world!' }]
            };
          },
          getOperatorList: async () => {
            return {
              fnArray: [pdfjsLib.OPS.paintImageXObject],
              argsArray: [['img1']]
            };
          },
          objs: {
            get: async (name: string) => {
              return {
                width: 1,
                height: 1,
                data: new Uint8Array([255, 0, 0])
              };
            }
          }
        };
      }
    };

    spyOn(pdfjsLib, 'getDocument').and.returnValue({ promise: Promise.resolve(mockPdfDocument) } as any);

    const result = await service.getPdfContent('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

    expect(result.text).toBe('Hello, world! ');
    expect(result.images.length).toBe(1);
    expect(result.images[0]).toContain('data:image/png;base64');
  });
});
