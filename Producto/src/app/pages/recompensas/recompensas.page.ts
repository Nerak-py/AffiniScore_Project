import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { giftOutline, star, timeOutline, checkmarkCircleOutline } from 'ionicons/icons';

interface Reward {
  key: string;
  title: string;
  description: string;
  cost: number;
}

@Component({
  selector: 'app-recompensas',
  templateUrl: './recompensas.page.html',
  styleUrls: ['./recompensas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RecompensasPage {
  public supabase = inject(SupabaseService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  rewards = signal<Reward[]>([
    {
      key: 'salida_noche',
      title: 'Salida de noche con amigos',
      description: 'Un pase libre para salir a divertirte con tu grupo de amigos sin reclamos.',
      cost: 850
    },
    {
      key: 'cena_romantica',
      title: 'Cena romántica sin celulares',
      description: 'Una velada especial preparada por tu pareja, totalmente desconectados de la tecnología.',
      cost: 500
    },
    {
      key: 'asado_amigos',
      title: 'Asado con amigos',
      description: 'Derecho a organizar un asado en casa con tu grupo de amigos de siempre.',
      cost: 700
    },
    {
      key: 'elegir_pelicula',
      title: 'Salida con derecho a elegir la película',
      description: 'Tú eliges qué película ver en el cine o la televisión sin debate ni objeción.',
      cost: 450
    }
  ]);

  redeemedHistory = signal<any[]>([]);
  isRedeeming = signal<boolean>(false);

  // Calcular el saldo de XP de la pareja de forma reactiva (suma de ambos)
  coupleXP = computed(() => {
    const myXP = this.supabase.userScore().xp || 0;
    const partnerXP = this.supabase.partnerProfile()?.xp || 0;
    return myXP + partnerXP;
  });

  constructor() {
    addIcons({ giftOutline, star, timeOutline, checkmarkCircleOutline });
  }

  async ionViewWillEnter() {
    await this.loadHistory();
  }

  async loadHistory() {
    const history = await this.supabase.loadRedeemedRewards();
    this.redeemedHistory.set(history);
  }

  // Comprobar si el usuario actual tiene suficiente saldo individual de XP para canjear (Opción A)
  canAfford(cost: number): boolean {
    const myXP = this.supabase.userScore().xp || 0;
    return myXP >= cost;
  }

  async redeem(reward: Reward) {
    if (!this.canAfford(reward.cost)) {
      const toast = await this.toastCtrl.create({
        message: 'No tienes suficiente XP personal para canjear este premio.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Canje',
      message: `¿Estás seguro de que quieres canjear "${reward.title}" por ${reward.cost} XP?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Canjear',
          handler: () => {
            this.executeRedeem(reward);
          }
        }
      ]
    });
    await alert.present();
  }

  private async executeRedeem(reward: Reward) {
    this.isRedeeming.set(true);
    const result = await this.supabase.redeemReward(reward.key, reward.title, reward.cost);
    this.isRedeeming.set(false);

    if (result.success) {
      const alert = await this.alertCtrl.create({
        header: '¡Premio Canjeado!',
        message: `Disfruten su actividad: "${reward.title}". Se han descontado ${reward.cost} XP de tu saldo.`,
        buttons: ['¡Genial!']
      });
      await alert.present();
      await this.loadHistory();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Error al realizar el canje: ' + (result.error?.message || 'Error desconocido'),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  getUserName(userId: string): string {
    const myProfile = this.supabase.userProfile();
    const partnerProfile = this.supabase.partnerProfile();

    if (userId === myProfile?.id) {
      return 'Tú';
    } else if (partnerProfile && userId === partnerProfile.id) {
      return partnerProfile.full_name?.split(' ')[0] || 'Tu pareja';
    }
    return 'Alguien';
  }
}
