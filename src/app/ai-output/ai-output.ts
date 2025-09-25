import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ai-output',
  imports: [],
  templateUrl: './ai-output.html',
  styleUrl: './ai-output.css'
})
export class AiOutput {
  @Input() message:string = ''
}
