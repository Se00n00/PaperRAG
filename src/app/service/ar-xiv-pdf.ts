
import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class ArXivPdfService {

  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  async getPdfContent(url: string): Promise<{ text: string; images: string[] }> {
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const numPages = pdf.numPages;
      let text = '';
      const images: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');

        const operators = await page.getOperatorList();
        for (let j = 0; j < operators.fnArray.length; j++) {
          const op = operators.fnArray[j];
          if (op === pdfjsLib.OPS.paintImageXObject) {
            const imageName = operators.argsArray[j][0];
            const image = await page.objs.get(imageName);

            if (!image || !image.data) {
              continue;
            }

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imageData = ctx.createImageData(image.width, image.height);
              if (image.data.length === image.width * image.height * 4) { // RGBA
                imageData.data.set(image.data);
              } else if (image.data.length === image.width * image.height * 3) { // RGB
                let k = 0;
                for (let l = 0; l < imageData.data.length; l += 4) {
                  imageData.data[l] = image.data[k];
                  imageData.data[l + 1] = image.data[k + 1];
                  imageData.data[l + 2] = image.data[k + 2];
                  imageData.data[l + 3] = 255;
                  k += 3;
                }
              } else if (image.data.length === image.width * image.height) { // Grayscale
                let k = 0;
                for (let l = 0; l < imageData.data.length; l += 4) {
                  const gray = image.data[k++];
                  imageData.data[l] = gray;
                  imageData.data[l + 1] = gray;
                  imageData.data[l + 2] = gray;
                  imageData.data[l + 3] = 255;
                }
              } else {
                console.warn('Unsupported image format:', image);
                continue;
              }
              ctx.putImageData(imageData, 0, 0);
              images.push(canvas.toDataURL());
            }
          }
        }
      }
      return { text, images };
    } catch (error) {
      console.error('Error getting PDF content:', error);
      return { text: '', images: [] };
    }
  }
}
