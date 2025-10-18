import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Papers } from './papers';

describe('Papers', () => {
  let component: Papers;
  let fixture: ComponentFixture<Papers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Papers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Papers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
