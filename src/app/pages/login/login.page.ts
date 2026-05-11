import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner, NavController, ToastController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonSpinner]
})
export class LoginPage {
  private supabase = inject(SupabaseService);
  private navCtrl = inject(NavController);
  private toastController = inject(ToastController);
  
  email = '';
  password = '';
  loading = signal(false);

  async onSubmit() {
    this.loading.set(true);
    const { error } = await this.supabase.login(this.email, this.password);
    this.loading.set(false);
    
    if (!error) {
      this.navCtrl.navigateRoot('/tabs/path');
    } else {
      console.error('Error in login:', error.message);
      const toast = await this.toastController.create({
        message: 'Error al iniciar sesión: ' + error.message,
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }
}
