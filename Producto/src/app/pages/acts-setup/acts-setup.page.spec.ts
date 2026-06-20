import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActsSetupPage } from './acts-setup.page';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ActsSetupPage', () => {
  let component: ActsSetupPage;
  let fixture: ComponentFixture<ActsSetupPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), CommonModule, FormsModule, ActsSetupPage]
    }).compileComponents();

    fixture = TestBed.createComponent(ActsSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
