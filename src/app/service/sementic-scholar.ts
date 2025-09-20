import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SementicScholar {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  constructor(private http: HttpClient) {}

  searchPapers(query: string, limit: number = 5): Observable<any> {
    const url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,abstract`;
    return this.http.get(url);
  }
}
