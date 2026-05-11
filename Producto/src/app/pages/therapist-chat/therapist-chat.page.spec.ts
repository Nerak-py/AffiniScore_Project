import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TherapistChatPage } from './therapist-chat.page';

describe('TherapistChatPage', () => {
  let component: TherapistChatPage;
  let fixture: ComponentFixture<TherapistChatPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TherapistChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
