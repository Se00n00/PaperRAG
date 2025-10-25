import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertStatus } from './upsert-status';

describe('UpsertStatus', () => {
  let component: UpsertStatus;
  let fixture: ComponentFixture<UpsertStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpsertStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpsertStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
