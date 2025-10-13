import { Component, Input } from '@angular/core';
import { MarkdownComponent} from 'ngx-markdown'
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-ai-output',
  imports: [MarkdownComponent,CommonModule],
  templateUrl: './ai-output.html',
  styleUrl: './ai-output.css'
})
export class AiOutput {
  @Input() message:string = ''
  @Input() type:string = ''
  @Input() heading:string|null = null
}
