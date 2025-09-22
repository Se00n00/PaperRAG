
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ArXivPdfService } from '../app/service/ar-xiv-pdf';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article.html',
  styleUrl: './article.css'
})
export class Article implements OnInit, OnChanges {
  @Input() paper_link: string = "";
  paper_title = "QLoRA: Efficient Finetuning of Quantized LLMs";
  pdfContent: string = '';

  constructor(private arXivPdfService: ArXivPdfService) { }

  ngOnInit() {
    this.loadPdfContent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['paper_link']) {
      this.loadPdfContent();
    }
  }

  async loadPdfContent() {
    if (this.paper_link) {
      const result = await this.arXivPdfService.getPdfContent(this.paper_link);
      this.pdfContent = result.text;
    }
  }
}
