import { AfterViewChecked, Component, ElementRef, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ArXiv } from './service/ar-xiv';
import { SementicScholar } from './service/sementic-scholar';
import { Article } from '../article/article';
import { AiOutput } from './ai-output/ai-output';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    Article,
    AiOutput
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements AfterViewChecked {
  constructor(private scholar: SementicScholar, private http:HttpClient) {}
  text: WritableSignal<string> = signal('');
  finalQuestion: WritableSignal<string> = signal('');

  isSearched = signal(false)
  isTouched = signal(false)
  
  onUserNameChange(newText: string) {
    this.isTouched.update((val)=>true)
    this.text.set(newText);
    if (this.text().length !== 0) {
      this.prepareToSend(3, this.text(), "keyword");
    }
  }

  timeLeftToSend = signal(10);
  private intervalId: any = null;
  prepareToSend(num: number, query:string, type:string) {
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
          if(type =="keyword" && !this.isSearched()){
            this.finalQuestion.set(query)
            this.isTouched.update((val)=>val = false)
            this.search()
            this.text.set("")
          }else if(this.isSearched()){
            this.queryLLM(query)
            this.text.set("")
          }
          else{
            this.paperLink.set(query)
            this.searchlinkInput.update((val)=>val = false)
            this.gotpaper.update((val)=>val=true)
          }
          
          return 0;
        }
      });
    }, 1000);
  }

  scholarPapers: WritableSignal<any[]> = signal([])
  currentPaper:any
  currentIndex = signal(0)
  index = 0

  
  search() {
    this.scholar.searchPapers(this.finalQuestion(), 10).subscribe((res: any) => {
      this.scholarPapers.set(res.data)
      if(res.data.length > 0){
        this.currentPaper = res.data[this.currentIndex()]
      }
    });

  }

  getlink(text:string){
    const match = text.match(/https?:\/\/[^\s,]+/);

    if (match) {
      const link = match[0];
      const pdfUrl = link.replace("/abs/", "/pdf/");
      return pdfUrl
    } else {
      return null
    }
  }
  
  // Paper Link -----------
  gotpaper = signal(false)
  paperLink:WritableSignal<string> = signal("")
  showPaper(paperUrl:any){
    this.isSearched.set(true)
    this.paperLink.set(paperUrl)
    this.gotpaper.update((val)=>val=true)
  }
  //---------------------- List of research papers Crousl
  upList(){
    this.currentIndex.update((val)=> (val+1)%this.scholarPapers().length)
    this.currentPaper = this.scholarPapers().at(this.currentIndex())
    this.index = this.currentIndex()
  }
  downList() {
    this.currentIndex.update(val => {
      const len = this.scholarPapers().length
      return (val - 1 + len) % len
    })
    this.currentPaper = this.scholarPapers().at(this.currentIndex())
  }


  // Search Paper Using PDF Link
  searchlink:WritableSignal<string> = signal("")
  searchlinkInput = signal(false)
  seachUsingLink(){
    this.searchlinkInput.update((val)=>val=!val)
  }
  onSearchLinkChange(link:string){
    this.searchlink.set(link);

    if (this.searchlink().length !== 0) {
      this.prepareToSend(3, this.searchlink(),"link");
    }
  }

  // New Session----------------------------------------
  newSession(){
    
    this.finalQuestion.set('')
    this.isSearched.set(false)
    this.isTouched.set(false)

    this.currentIndex.set(0)
    this.currentPaper = null
    this.scholarPapers.set([])

    this.gotpaper.set(false)
    this.paperLink.set('')

    this.searchlink.set('')
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------- RAG CHAT REQUEST -----------------------------------------------------------
  message2Component:WritableSignal<string[]> = signal([])

  async queryLLM(prompt: string) {
    let res = await fetch(`https://paperrag-embedding.onrender.com/chat?query=${encodeURIComponent(prompt)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    this.message2Component.update(prev => [
      ...prev, ''
    ]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      
      this.message2Component.update(prev => {
        const last = prev[prev.length - 1]
        return [...prev.slice(0, -1), last + chunk];
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  @ViewChild('bottom') bottom!: ElementRef;
  private scrollToBottom(): void {
    if (this.bottom) {
      this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}