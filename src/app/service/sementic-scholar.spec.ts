import { TestBed } from '@angular/core/testing';

import { SementicScholar } from './sementic-scholar';

describe('SementicScholar', () => {
  let service: SementicScholar;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SementicScholar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
