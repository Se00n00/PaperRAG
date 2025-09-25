import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiOutput } from './ai-output';

describe('AiOutput', () => {
  let component: AiOutput;
  let fixture: ComponentFixture<AiOutput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiOutput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiOutput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
