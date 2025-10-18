import { Component, signal, Input, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-papers',
  imports: [CommonModule],
  templateUrl: './papers.html',
  styleUrl: './papers.css'
})
export class Papers {
  showauthors = signal(false)
  @Input() scholarPapers:any = []
  @Input() currentPaper:any
  currentIndex = signal(0)
  index = 0


   //---------------------- List of research papers Crousl
  upList(){
    this.currentIndex.update((val)=> (val+1)%this.scholarPapers.length)
    this.currentPaper = this.scholarPapers.at(this.currentIndex())
    this.index = this.currentIndex()
  }
  
  downList() {
    this.currentIndex.update(val => {
      const len = this.scholarPapers.length
      return (val - 1 + len) % len
    })
    this.currentPaper = this.scholarPapers.at(this.currentIndex())
  }

}
