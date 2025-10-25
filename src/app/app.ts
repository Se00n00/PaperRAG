import { AfterViewChecked, Component, ElementRef, signal, ViewChild, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ArXiv } from './service/ar-xiv';
import { SementicScholar } from './service/sementic-scholar';
import { Article } from '../article/article';
import { AiOutput } from './ai-output/ai-output';
import { Papers } from './papers/papers';
import { Supabase } from './service/authentication/supabase';
import { retryWhen, delay, take, tap, filter } from 'rxjs/operators';
import { Examples } from './examples/examples';
import { UpsertStatus } from './upsert-status/upsert-status';

interface Message{
  type: string
  heading: any
  content: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    AiOutput,
    Papers,
    Examples,
    UpsertStatus
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements AfterViewChecked {
  constructor(private scholar: SementicScholar, private http:HttpClient, public auth:Supabase) {}
  text: WritableSignal<string> = signal('');
  finalQuestion: WritableSignal<string> = signal('');

  isSearched = signal(false)
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

          if(this.isSearched()){
            this.queryLLM(this.text())
          }else{
            this.search(this.text())
          }
          
          this.text.set("")
          return 0;
        }
      });
    }, 1500);
  }

  scholarPapers: WritableSignal<any[]> = signal([])
  currentPaper: any

  // ---------------------------------------------- Search for List of research papers
  

  async search(query: string) {
    this.scholar.searchPapers(query, 5).pipe(
      retryWhen(errors =>
        errors.pipe(
          filter(err => err?.status === 0 || err?.code === 0),
          tap(() => console.warn('Error code 0, retrying...')),
          delay(2000),
          take(3)
        )
      )
    ).subscribe({
      next: (data) => {
        this.scholarPapers.set(data.data);
        if (data.data.length > 0) {
          this.currentPaper = data.data[0];
        }
      },
      error: (err) => {
        console.error('Error fetching papers after retries:', err);
      },
    });
  }




  
  // Paper Link -----------
  gotpaper = signal(false)
  paperLink:WritableSignal<string> = signal("")
  showPaper(paperUrl:any){
    this.isSearched.set(true)
    this.paperLink.set(paperUrl)
    this.gotpaper.update((val)=>val=true)
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
  newSession(namespace:string){
    if(!this.isSearched()) return

    this.deletePdf(namespace)
    
    this.finalQuestion.set('')
    this.isSearched.set(false)
    this.isTouched.set(false)
    this.currentPaper = null
    this.scholarPapers.set([])

    this.gotpaper.set(false)
    this.paperLink.set('')

    this.searchlink.set('')

    // this.message2Component.set([{"type":"SYSTEM","heading":"Welcome","content":"Ask anything from the selected paper"}])
  }

  deletePdf(namespace:string) {
    const url = `${import.meta.env.NG_APP_RAG_BACKEND}/delete_namespace`
    const body = { namespace: namespace};

    this.http.delete(url, { headers: { 'Content-Type': 'application/json' }, body })
      .subscribe({
        next: (response) => {
          console.log(response)
        },
        error: (err) => {
          console.error('Error posting PDF URL:', err);
        }
      });
  }
  
  newConversation(message:any){
    this.message2Component.set([message])
    this.isSearched.set(true)
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
  message2Component:WritableSignal<Message[]> = signal([])

  async queryLLM(prompt: string) {
    this.message2Component.update(prev => [
      ...prev,
      {type:"USER", heading:null, content:prompt}
    ]);
    
    let res = await fetch(`${import.meta.env.NG_APP_RAG_BACKEND}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    try {
      // this.message2Component.update(prev => [
      //   ...prev,
      //   {type:"ASSISTANT", heading:"", content:""}
      // ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk.trim()) continue;

        let data;
        try {
          data = JSON.parse(chunk);
          // console.log(data)
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
                  (data.content ?? "")
              };
            } else {
              updated.push({
                type: "ASSISTANT",
                heading: data.heading ?? "Response",
                content: data.content ?? ""
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

  // ----------------------------------------------------------------
  // List of Example Papers: ----------------------------------------
  // ----------------------------------------------------------------
  
}