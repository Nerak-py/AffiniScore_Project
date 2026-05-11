import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class OnboardingPage implements OnInit {
  onboardingForm!: FormGroup;
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  
  isSubmitting = false;

  ngOnInit() {
    this.onboardingForm = this.fb.group({
      favorite_color: ['', Validators.required],
      birthday: ['', Validators.required],
      childhood_dream: ['', Validators.required],
      meeting_place: ['', Validators.required]
    });
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
