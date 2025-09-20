import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArXiv {
  private baseUrl = 'http://export.arxiv.org/api/query';

  constructor(private http: HttpClient) {}

  search(query: string, maxResults: number = 5): Observable<any[]> {
    const url = `${this.baseUrl}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;

    return this.http.get(url, { responseType: 'text' }).pipe(
      map((xml: string) => this.parseXml(xml))
    );
  }

  private parseXml(xml: string): any[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const entries = doc.getElementsByTagName('entry');

    const results: any[] = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      results.push({
        id: entry.getElementsByTagName('id')[0]?.textContent,
        title: entry.getElementsByTagName('title')[0]?.textContent?.trim(),
        summary: entry.getElementsByTagName('summary')[0]?.textContent?.trim(),
        authors: Array.from(entry.getElementsByTagName('author')).map(
          (a) => a.getElementsByTagName('name')[0]?.textContent
        ),
        published: entry.getElementsByTagName('published')[0]?.textContent
      });
    }
    return results;
  }
}
