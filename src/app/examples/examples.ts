import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-examples',
  imports: [CommonModule],
  templateUrl: './examples.html',
  styleUrl: './examples.css'
})
export class Examples {
  @Output() Upsert_process = new EventEmitter<boolean>()
  @Output() paper_details = new EventEmitter<{
    url:string,
    title:string, 
    year:number,
    author:string
  }>()
  
  constructor(){
    this.periodic_inc_current_paper_index()
  }

  Current_paper_index = signal(0)
  Paper_List = [
    {"title":"Attention Is All You Need", "year":2017, "author":"Vaswani et al.", "link_to_pdf":"https://arxiv.org/pdf/1706.03762"},
    {"title":"BERT: Pre‑training of Deep Bidirectional Transformers for Language Understanding", "year":2018, "author":"Devlin et al.", "link_to_pdf":"https://arxiv.org/pdf/1810.04805"},
    {"title":"Exploring the Limits of Transfer Learning with a Unified Text‑to‑Text Transformer", "year":2019, "author":"Raffel et al.", "link_to_pdf":"https://arxiv.org/pdf/1910.10683"},
    {"title":"An Image is Worth 16×16 Words: Transformers for Image Recognition at Scale", "year":2020, "author":"Dosovitskiy et al.", "link_to_pdf":"https://arxiv.org/pdf/2010.11929"},
    {"title":"Linear attention is (maybe) all you need (to understand transformer optimization)", "year":2023, "author":"Ahn et al.", "link_to_pdf":"https://arxiv.org/pdf/2310.01082"}
  ]

  periodic_inc_current_paper_index(){
    setInterval(()=>{
      this.Current_paper_index.update(
        (value:number) => (value+1)%this.Paper_List.length
      )
    }, 3000)
  }

  Ask_ai(url:string, title:string, year:number, author:string){
    this.Upsert_process.emit(true)
    this.paper_details.emit(
      {url,title,year,author}
    )
  }
}
