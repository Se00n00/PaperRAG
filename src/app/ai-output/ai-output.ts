import { Component, Input } from '@angular/core';
import { MarkdownComponent} from 'ngx-markdown'

@Component({
  selector: 'app-ai-output',
  imports: [MarkdownComponent],
  templateUrl: './ai-output.html',
  styleUrl: './ai-output.css'
})
export class AiOutput {
  @Input() message:string = ''
}
