import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  sparklesOutline,
  trophyOutline,
  heartOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  giftOutline,
  ribbonOutline,
  mailOutline,
  sendOutline,
  happyOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-buzon-romantico',
  templateUrl: './buzon-romantico.page.html',
  styleUrls: ['./buzon-romantico.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BuzonRomanticoPage implements OnInit, OnDestroy {
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  gameState = signal<'loading' | 'active'>('loading');
  gameData = signal<any>(null);
  partnerName = signal<string>('Tu pareja');
  showConfetti = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  myUserId: string = '';
  partnerId: string = '';
  isUser1: boolean = false; // true si mi ID es alfabéticamente menor
  private realtimeChannel: any = null;

  myDeseos = signal<any[]>([]);
  partnerDeseos = signal<any[]>([]);
  myDeseosSubmitted = signal<boolean>(false);
  partnerDeseosSubmitted = signal<boolean>(false);

  // Inputs para la Fase 1
  deseo1Input: string = '';
  deseo2Input: string = '';
  deseo3Input: string = '';

  // Valores calculados
  partnerCompletedCount = computed(() => this.partnerDeseos().filter(d => d.completado).length);
  myCompletedCount = computed(() => this.myDeseos().filter(d => d.completado).length);

  constructor() {
    addIcons({
      arrowBackOutline,
      sparklesOutline,
      trophyOutline,
      heartOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      giftOutline,
      ribbonOutline,
      mailOutline,
      sendOutline,
      happyOutline
    });
  }

  async ngOnInit() {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.myUserId = user.id;

    if (!this.supabaseService.userProfile()) {
      await this.supabaseService.loadUserProfile(user.id);
    }

    const partner = this.supabaseService.partnerProfile();
    if (!partner) {
      this.router.navigate(['/tabs/path']);
      return;
    }

    this.partnerId = partner.id;
    this.partnerName.set(partner.full_name?.split(' ')[0] || 'tu pareja');
    this.isUser1 = this.myUserId < this.partnerId;

    await this.loadOrInitGame();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
  }

  async loadOrInitGame() {
    try {
      const { data, error } = await this.supabaseService.getDeseosGame(this.myUserId, this.partnerId);

      if (data) {
        this.gameData.set(data);
        this.processGameData(data);
      } else {
        const sortedUserId = this.myUserId < this.partnerId ? this.myUserId : this.partnerId;
        const sortedPartnerId = this.myUserId < this.partnerId ? this.partnerId : this.myUserId;

        const { data: newGame, error: errInsert } = await this.supabaseService.client
          .from('deseos_game')
          .insert({
            user_id: sortedUserId,
            partner_id: sortedPartnerId,
            deseos_user_1: [],
            deseos_user_2: [],
            status: 'pending'
          })
          .select()
          .single();

        if (newGame) {
          this.gameData.set(newGame);
          this.processGameData(newGame);
        } else {
          console.error('Error al inicializar deseos_game:', errInsert);
        }
      }
      this.gameState.set('active');
    } catch (err) {
      console.error('Error cargando deseos_game:', err);
    }
  }

  processGameData(game: any) {
    if (!game) return;

    if (this.isUser1) {
      this.myDeseos.set(game.deseos_user_1 || []);
      this.partnerDeseos.set(game.deseos_user_2 || []);
    } else {
      this.myDeseos.set(game.deseos_user_2 || []);
      this.partnerDeseos.set(game.deseos_user_1 || []);
    }

    this.myDeseosSubmitted.set(this.myDeseos().length === 3);
    this.partnerDeseosSubmitted.set(this.partnerDeseos().length === 3);

    // Condición de victoria
    const allD1 = game.deseos_user_1 || [];
    const allD2 = game.deseos_user_2 || [];
    if (
      allD1.length === 3 && allD1.every((d: any) => d.completado) &&
      allD2.length === 3 && allD2.every((d: any) => d.completado)
    ) {
      this.triggerConfetti();
    }
  }

  setupRealtimeSubscription() {
    const game = this.gameData();
    if (!game) return;

    this.realtimeChannel = this.supabaseService.client
      .channel(`deseos_game_channel_${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deseos_game',
          filter: `id=eq.${game.id}`
        },
        (payload: any) => {
          console.log('Cambio recibido en tiempo real (deseos_game):', payload.new);
          this.gameData.set(payload.new);
          this.processGameData(payload.new);
        }
      )
      .subscribe();
  }

  async saveMyDeseos() {
    if (this.isSubmitting()) return;

    const d1 = this.deseo1Input.trim();
    const d2 = this.deseo2Input.trim();
    const d3 = this.deseo3Input.trim();

    if (!d1 || !d2 || !d3) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, escribe tus 3 deseos para poder continuar.',
        duration: 3000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { data, error } = await this.supabaseService.saveDeseos(
        this.myUserId,
        this.partnerId,
        [d1, d2, d3]
      );

      if (error) {
        console.error('Error al guardar tus deseos:', error);
        const toast = await this.toastCtrl.create({
          message: 'Error al guardar tus deseos. Revisa la base de datos.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      } else {
        this.gameData.set(data);
        this.processGameData(data);

        const toast = await this.toastCtrl.create({
          message: '¡Tus deseos han sido depositados en el buzón! 💌',
          duration: 3000,
          color: 'success'
        });
        toast.present();
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async concederDeseo(idx: number) {
    const game = this.gameData();
    if (!game || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const deseos1 = [...game.deseos_user_1];
    const deseos2 = [...game.deseos_user_2];

    if (this.isUser1) {
      deseos2[idx] = { ...deseos2[idx], completado: true };
    } else {
      deseos1[idx] = { ...deseos1[idx], completado: true };
    }

    const allDeseos1Completed = deseos1.length === 3 && deseos1.every((d: any) => d.completado);
    const allDeseos2Completed = deseos2.length === 3 && deseos2.every((d: any) => d.completado);
    const nextStatus = (allDeseos1Completed && allDeseos2Completed) ? 'completed' : 'pending';

    try {
      const { data, error } = await this.supabaseService.updateDeseosStatus(
        game.id,
        deseos1,
        deseos2,
        nextStatus
      );

      if (error) {
        console.error('Error al conceder deseo:', error);
        const toast = await this.toastCtrl.create({
          message: 'Error al actualizar el deseo. Inténtalo de nuevo.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      } else {
        this.gameData.set(data);
        this.processGameData(data);

        if (nextStatus === 'completed') {
          await this.supabaseService.completeActivity6(1000);
          const toast = await this.toastCtrl.create({
            message: '🎉 ¡Felicidades! Han concedido todos los deseos y ganado 1000 XP.',
            duration: 5000,
            color: 'success',
            position: 'top'
          });
          toast.present();
        } else {
          const toast = await this.toastCtrl.create({
            message: '¡Deseo concedido! Haces muy feliz a tu pareja. ❤️',
            duration: 3000,
            color: 'success'
          });
          toast.present();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  triggerConfetti() {
    this.showConfetti.set(true);
    setTimeout(() => {
      this.showConfetti.set(false);
    }, 8000);
  }

  goBackToPath() {
    this.router.navigate(['/tabs/path']);
  }
}
