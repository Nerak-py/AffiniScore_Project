import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner, NavController, ToastController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner]
})
export class RegisterPage {
  private supabase = inject(SupabaseService);
  private navCtrl = inject(NavController);
  private toastController = inject(ToastController);
  
  fullName = '';
  email = '';
  password = '';
  loading = signal(false);

  async onSubmit() {
    this.loading.set(true);
    const { data, error } = await this.supabase.register(this.email, this.password, this.fullName);
    this.loading.set(false);
    
    if (error) {
      console.log('=== SUPABASE REGISTER ERROR ===', error);
      const toast = await this.toastController.create({
        message: 'Error al registrar: ' + error.message,
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } else if (data.user) {
      const toast = await this.toastController.create({
        message: '¡Registro exitoso!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      this.navCtrl.navigateRoot('/tabs/path');
    }
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
