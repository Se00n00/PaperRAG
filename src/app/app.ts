import { Component, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ArXiv } from './service/ar-xiv';
import { SementicScholar } from './service/sementic-scholar';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  text: WritableSignal<string> = signal('');
  isTouched = signal(false)
  timeLeftToSend = signal(10);
  finalQuestion: WritableSignal<string> = signal('');
  private intervalId: any = null;

  onUserNameChange(newText: string) {
    this.isTouched.update((val)=>true)
    this.text.set(newText);
    if (this.text().length !== 0) {
      this.prepareToSend(3);
    }
  }

  prepareToSend(num: number) {
    this.timeLeftToSend.set(num);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.timeLeftToSend.update((val) => {
        if (val > 1) {
          return val - 1;
        } else {
          clearInterval(this.intervalId);
          this.intervalId = null;
          this.finalQuestion.set(this.text())
          this.isTouched.update((val)=>false)
          this.search()
          return 0;
        }
      });
    }, 1000);
  }

  scholarPapers: WritableSignal<any[]> = signal([])
  currentPaper:any
  currentIndex = signal(0)

  constructor(private arxiv: ArXiv, private scholar: SementicScholar) {}
  search() {
    this.scholar.searchPapers(this.finalQuestion(), 10).subscribe((res: any) => {
      this.scholarPapers.set(res.data)
      if(res.data.length > 0){
        this.currentPaper = res.data[this.currentIndex()]
        console.log(this.currentPaper)
      }
    });
  }
}