import { TestBed } from '@angular/core/testing';

import { ArXiv } from './ar-xiv';

describe('ArXiv', () => {
  let service: ArXiv;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArXiv);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
