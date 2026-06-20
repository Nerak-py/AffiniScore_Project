import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface Dialogue {
  text: string;
  emotion: 'feliz' | 'hablando' | 'pensativo';
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class OnboardingPage implements OnInit, OnDestroy {
  onboardingForm!: FormGroup;
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  
  isSubmitting = false;

  // Lógica del Overlay de Afi
  showAfiOverlay = true;
  dialogues: Dialogue[] = [
    { text: '¡Oh, cierto! Lo olvidé.', emotion: 'pensativo' },
    { text: 'Te pediremos unos datos adicionales para personalizar mejor las misiones y trivias de su relación.', emotion: 'hablando' },
    { text: 'Esto será pura ventaja para que su experiencia sea 100% genuina. ¡Llenen estos datos y comencemos!', emotion: 'feliz' }
  ];
  currentIndex = 0;
  displayedText = '';
  isTyping = false;
  private timer: any = null;
  private typingSpeed = 40; // ms

  ngOnInit() {
    this.onboardingForm = this.fb.group({
      favorite_color: ['', Validators.required],
      birthday: ['', Validators.required],
      childhood_dream: ['', Validators.required],
      meeting_place: ['', Validators.required],
      gender: ['', Validators.required],
      pronoun: ['']
    });

    this.onboardingForm.get('gender')?.valueChanges.subscribe(value => {
      const pronounControl = this.onboardingForm.get('pronoun');
      if (value === 'No binario') {
        pronounControl?.setValidators([Validators.required]);
      } else {
        pronounControl?.clearValidators();
        pronounControl?.setValue('');
      }
      pronounControl?.updateValueAndValidity();
    });

    this.startDialogue();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startDialogue() {
    this.clearTimer();
    this.displayedText = '';
    this.isTyping = true;
    
    const currentDialogue = this.dialogues[this.currentIndex].text;
    let charIndex = 0;

    this.timer = setInterval(() => {
      if (charIndex < currentDialogue.length) {
        this.displayedText += currentDialogue.charAt(charIndex);
        charIndex++;
      } else {
        this.finishTyping();
      }
    }, this.typingSpeed);
  }

  finishTyping() {
    this.clearTimer();
    this.displayedText = this.dialogues[this.currentIndex].text;
    this.isTyping = false;
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getCharacterImage(): string {
    const currentDialogue = this.dialogues[this.currentIndex];
    return `assets/images/afi_${currentDialogue.emotion}.png`;
  }

  onImageError(event: any) {
    const target = event.target as HTMLImageElement;
    if (target.src !== 'assets/images/afi.png' && !target.src.endsWith('/assets/images/afi.png')) {
      target.src = 'assets/images/afi.png';
    }
  }

  onOverlayClick(event: Event) {
    event.stopPropagation();
    if (this.isTyping) {
      this.finishTyping();
    } else {
      if (this.currentIndex < this.dialogues.length - 1) {
        this.currentIndex++;
        this.startDialogue();
      } else {
        this.showAfiOverlay = false;
      }
    }
  }

  async submitForm() {
    console.log('✅ Botón "Iniciar Aventura" presionado.');
    console.log('¿El formulario es válido?:', this.onboardingForm.valid);
    console.log('Valores del formulario:', this.onboardingForm.value);

    if (this.onboardingForm.invalid) {
      console.warn('⚠️ Faltan campos por llenar.');
      this.onboardingForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    const { error } = await this.supabaseService.saveOnboardingData(this.onboardingForm.value);
    this.isSubmitting = false;

    if (!error) {
      console.log('🚀 Datos guardados exitosamente. Navegando al mapa...');
      localStorage.setItem('pending_linking_cutscene', 'true');
      this.router.navigate(['/tabs/path']);
    } else {
      console.error('❌ Error guardando en Supabase:', error);
      const toast = await this.toastController.create({
        message: 'Error de Supabase. Revisa los permisos y que las columnas existan en tu tabla "profiles".',
        duration: 5000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }
}
