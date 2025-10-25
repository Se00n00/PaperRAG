import { Component, signal, Input, WritableSignal, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { options } from 'marked';
@Component({
  selector: 'app-papers',
  imports: [CommonModule],
  templateUrl: './papers.html',
  styleUrl: './papers.css'
})
export class Papers {
  constructor(private http:HttpClient){}
  showauthors = signal(false)
  @Input() scholarPapers:any = []
  @Input() currentPaper:any
  @Output() Upsert_process = new EventEmitter<boolean>()
  @Output() paper_details = new EventEmitter<{
    url:string,
    title:string, 
    year:number,
    author:string
  }>()

  currentIndex = signal(0)
  index = 0

  upload_started = signal(false)


  //---------------------- List of research papers Crousl
  upList(){
    this.currentIndex.update((val)=> (val+1)%this.scholarPapers.length)
    this.currentPaper = this.scholarPapers.at(this.currentIndex())
    if(this.currentPaper.openAccessPdf["url"] == ""){
      this.currentPaper.openAccessPdf["url"] = this.GetPdfLink(this.currentPaper.openAccessPdf["disclaimer"])
    }
    this.index = this.currentIndex()
  }
  
  downList() {
    this.currentIndex.update(val => {
      const len = this.scholarPapers.length
      return (val - 1 + len) % len
    })
    this.currentPaper = this.scholarPapers.at(this.currentIndex())
    if(this.currentPaper.openAccessPdf["url"] == ""){
      this.currentPaper.openAccessPdf["url"] = this.GetPdfLink(this.currentPaper.openAccessPdf["disclaimer"])
    }
  }

  GetPdfLink(link:string){
    const match = link.match(/https:\/\/arxiv\.org\/abs\/[^\s,]+/)
  
    if (!match) {
      return null
    }
    const absLink = match[0]
    const pdfLink = absLink.replace('/abs/', '/pdf/')

    return pdfLink;
  }

  Ask_ai(url:any, title:string, year:number, author:string){
    this.Upsert_process.emit(true)
    this.paper_details.emit(
      {url,title,year,author}
    )
  }

  // upsertPdf(pdf_url:any) {
  //   this.upload_started.set(true)
  //   const url = `${import.meta.env.NG_APP_RAG_BACKEND}/upsert`
  //   const body = { url: pdf_url , namespace:"notdecided"};

  //   // POST request
  //   this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } })
  //     .subscribe({
  //       next: (response) => {
  //         this.startConversation.emit(response);
  //       },
  //       error: (err) => {
          
  //         console.error('Error posting PDF URL:', err);
  //       }
  //     });
  //   this.upload_started.set(false)
  // }

}
