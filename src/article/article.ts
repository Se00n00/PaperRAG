
import { Component, computed, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ArXivPdfService } from '../app/service/ar-xiv-pdf';
import { CommonModule } from '@angular/common';
import { PdfParser } from '../app/service/pdf-parser';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {PdfViewerModule} from 'ng2-pdf-viewer'

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './article.html',
  styleUrl: './article.css'
})
export class Article implements OnInit, OnChanges {
  @Input() paper_link: string = "";

  paper_url: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.updatePaperUrl();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['paper_link']) {
      this.updatePaperUrl();
    }
  }

  updatePaperUrl() {
    if (this.paper_link) {
      const url = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(this.paper_link)}`;
      this.paper_url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      this.paper_url = null;
    }
  }

  // async loadPdfContent() {
  //   if (this.paper_link) {
  //     this.pdfParser.getPdfText(this.paper_link).pipe(
  //       map(text => {
  //         const abstractMatch = text.match(/Abstract\s*(.*?)1\s*Introduction/i);
  //         const introductionMatch = text.match(/1\s*Introduction\s*(.*?)2/i);

  //         return {
  //           abstract: abstractMatch ? abstractMatch[1].trim() : 'Abstract not found.',
  //           introduction: introductionMatch ? introductionMatch[1].trim() : 'Introduction not found.'
  //         };
  //       })
  //     ).subscribe(result => {
  //       this.abstractContent = result.abstract;
  //       this.introductionContent = result.introduction;

  //       console.log("ABSTRACT: ", this.abstractContent,"\n INTRODUCTION: ",this.introductionContent)
  //     });
  //   }
  // }
}
