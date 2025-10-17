import { AfterViewChecked, Component, ElementRef, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ArXiv } from './service/ar-xiv';
import { SementicScholar } from './service/sementic-scholar';
import { Article } from '../article/article';
import { AiOutput } from './ai-output/ai-output';

import { Supabase } from './service/authentication/supabase';
interface Message{
  type: string
  heading: string | null
  content: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    AiOutput
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements AfterViewChecked {
  constructor(private scholar: SementicScholar, private http:HttpClient, public auth:Supabase) {}
  text: WritableSignal<string> = signal('');
  finalQuestion: WritableSignal<string> = signal('');

  isSearched = signal(true)
  isTouched = signal(false)

  thread_id: any

  showauthors = signal(false)
  
  onUserNameChange(newText: string) {
    this.isTouched.update((val)=>true)
    this.text.set(newText);
    if (this.text().length !== 0) {
      this.prepareToSend(3, this.text(), "paper");
    }
  }

  get_thread_id(){
    console.log("THREAD ID:", this.auth.getCurrentThread())
    this.thread_id = this.auth.getCurrentThread()
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

          this.finalQuestion.set(query)
          this.isTouched.update((val)=>val = false)
          this.queryLLM(this.text())
          // this.search(type)
          this.text.set("")

          // if(type =="keyword" && !this.isSearched()){
            
          // }else if(this.isSearched()){
          //   this.queryLLM(query)
          //   this.text.set("")
          // }
          // else{
          //   this.paperLink.set(query)
          //   this.searchlinkInput.update((val)=>val = false)
          //   this.gotpaper.update((val)=>val=true)
          // }
          
          return 0;
        }
      });
    }, 1000);
  }

  scholarPapers: WritableSignal<any[]> = signal([])
  currentPaper:any
  currentIndex = signal(0)
  index = 0

  // ----------------------- Search for List of research papers
  async search(endpoint:string) {
    let res = await fetch(`${import.meta.env.NG_APP_PAPERS_BACKEND}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: this.finalQuestion() })
    });
    let data = await res.json();
    this.scholarPapers.set(data['search_results'])
    if(data['search_results'].length > 0){
      this.currentPaper = data['search_results'][this.currentIndex()]
    }
    console.log(data)
    
    console.log("Fetched Papers List");
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
      this.prepareToSend(3, this.searchlink(),"paper_using_link");
    }
  }

  // ---------------------------------------------------------------- New Session----------------------------------------
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
  message2Component:WritableSignal<Message[]> = signal([
    {type:"USER", heading:null, content:"Hii! **Hello**"},
    {type:"ASSISTANT", heading:"Introduction", content:"### Hello! how may i help you ?"},
    {type:"SYSTEM", heading:"Error", content:"Something just happened!"}
  ])

  async queryLLM(prompt: string) {
    this.message2Component.update(prev => [
      ...prev,
      {type:"USER", heading:null, content:prompt}
    ]);
    
    let res = await fetch("https://paperrag-ut04.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    try {
      this.message2Component.update(prev => [
        ...prev,
        {type:"ASSISTANT", heading:"", content:""}
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk.trim()) continue;

        let data;
        try {
          data = JSON.parse(chunk);
        } catch {
          console.warn("Non-JSON chunk:", chunk);
          continue;
        }

        if (data.type === "ASSISTANT") {
          this.message2Component.update(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            if (updated[lastIndex]?.type === "ASSISTANT") {
              // Append new content to the last assistant message
              updated[lastIndex] = {
                ...updated[lastIndex],
                heading: data.heading ?? updated[lastIndex].heading,
                content:
                  (updated[lastIndex].content || "") +
                  (data.answer ?? "")
              };
            } else {
              updated.push({
                type: "ASSISTANT",
                heading: data.heading ?? "Response",
                content: data.answer ?? ""
              });
            }

            return updated;
          });
        } else if (data.type === "SYSTEM") {
          this.message2Component.update(prev => [
            ...prev,
            { type: "SYSTEM", heading: "System Message", content: data.answer ?? "" }
          ]);
        }
      }
    } catch (err) {
      this.message2Component.update(prev => [
        ...prev,
        { type: "SYSTEM", heading: "Error", content: String(err) }
      ]);
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