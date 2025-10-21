import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SementicScholar {
  private proxyUrl = 'https://paper-rag-nt9s.vercel.app/api/search'

  constructor(private http: HttpClient) {}

  searchPapers(query: string, limit: number = 5): Observable<any> {
    const url = `${this.proxyUrl}?q=${encodeURIComponent(query)}`;
    return this.http.get(url);
  }
}
