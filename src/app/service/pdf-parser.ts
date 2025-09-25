import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfParser {
  constructor(private http: HttpClient) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  public getPdfText(pdfUrl: string): Observable<string> {
    return this.http.get(pdfUrl, { responseType: 'arraybuffer' }).pipe(
      switchMap(arrayBuffer => {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        return from(loadingTask.promise);
      }),
      switchMap(pdfDocument => {
        const numPages = pdfDocument.numPages;
        const textPromises = [];
        for (let i = 1; i <= numPages; i++) {
          textPromises.push(
            pdfDocument.getPage(i).then(page => {
              return page.getTextContent();
            })
          );
        }
        return from(Promise.all(textPromises));
      }),
      map(pagesTextContent => {
        let fullText = '';
        pagesTextContent.forEach(page => {
          page.items.forEach((item: any) => {
            fullText += item.str + ' ';
          });
        });
        return fullText;
      })
    );
  }
}
