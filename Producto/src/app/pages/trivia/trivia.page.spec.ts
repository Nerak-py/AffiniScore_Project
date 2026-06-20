import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TriviaPage } from './trivia.page';

describe('TriviaPage', () => {
  let component: TriviaPage;
  let fixture: ComponentFixture<TriviaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TriviaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
