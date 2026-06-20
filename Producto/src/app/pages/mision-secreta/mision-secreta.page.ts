import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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
  ribbonOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-mision-secreta',
  templateUrl: './mision-secreta.page.html',
  styleUrls: ['./mision-secreta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MisionSecretaPage implements OnInit, OnDestroy {
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  misiones: string[] = [
    'Prepárale su comida favorita por sorpresa',
    'Hazle un masaje de 15 minutos sin que lo pida',
    'Déjale una nota de amor escondida en sus cosas',
    'Cómprale su dulce o postre preferido al volver a casa',
    'Organiza una cita sorpresa improvisada en la sala',
    'Ayúdale con una tarea o quehacer doméstico que no te corresponda',
    'Prepárale un café o té caliente por la mañana y llévaselo a la cama',
    'Escríbele un mensaje largo apreciando algo específico de él/ella',
    'Dale un abrazo de oso por sorpresa durante al menos 30 segundos',
    'Planifica una tarde de películas con sus snacks favoritos listos',
    'Hazle un cumplido sincero mirándolo/a directamente a los ojos',
    'Limpia su coche o su espacio de trabajo favorito por sorpresa'
  ];

  gameState = signal<'loading' | 'active'>('loading');
  gameData = signal<any>(null);
  partnerName = signal<string>('Tu pareja');
  showConfetti = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  myUserId: string = '';
  partnerId: string = '';
  isUser1: boolean = false; // true si mi ID es menor
  private realtimeChannel: any = null;

  myMissions = signal<string[]>([]);
  partnerMissions = signal<string[]>([]);
  myValidatedCount = signal<number>(0); // Cuántas misiones mías ha validado mi pareja
  partnerValidatedCount = signal<number>(0); // Cuántas misiones de mi pareja he validado yo

  constructor() {
    addIcons({
      arrowBackOutline,
      sparklesOutline,
      trophyOutline,
      heartOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      giftOutline,
      ribbonOutline
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

  getRandomMissions(count: number): string[] {
    const shuffled = [...this.misiones].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async loadOrInitGame() {
    try {
      const { data, error } = await this.supabaseService.getMisionSecretaGame(this.myUserId, this.partnerId);

      if (data) {
        this.gameData.set(data);
        this.processGameData(data);
        this.gameState.set('active');
      } else {
        const misiones1 = this.getRandomMissions(3);
        const misiones2 = this.getRandomMissions(3);

        const { data: newGame, error: initError } = await this.supabaseService.initializeMisionSecretaGame(
          this.myUserId,
          this.partnerId,
          misiones1,
          misiones2
        );

        if (newGame) {
          this.gameData.set(newGame);
          this.processGameData(newGame);
          this.gameState.set('active');
        } else {
          console.error('Error al inicializar las misiones secretas:', initError);
        }
      }
    } catch (err) {
      console.error('Error cargando misiones secretas:', err);
    }
  }

  processGameData(game: any) {
    if (!game) return;

    if (this.isUser1) {
      this.myMissions.set(game.misiones_user_1 || []);
      this.partnerMissions.set(game.misiones_user_2 || []);
      this.myValidatedCount.set(game.sorpresas_validadas_1 || 0);
      this.partnerValidatedCount.set(game.sorpresas_validadas_2 || 0);
    } else {
      this.myMissions.set(game.misiones_user_2 || []);
      this.partnerMissions.set(game.misiones_user_1 || []);
      this.myValidatedCount.set(game.sorpresas_validadas_2 || 0);
      this.partnerValidatedCount.set(game.sorpresas_validadas_1 || 0);
    }

    if (game.sorpresas_validadas_1 === 3 && game.sorpresas_validadas_2 === 3) {
      this.triggerConfetti();
    }
  }

  setupRealtimeSubscription() {
    const game = this.gameData();
    if (!game) return;

    this.realtimeChannel = this.supabaseService.client
      .channel(`mision_secreta_channel_${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mision_secreta_game',
          filter: `id=eq.${game.id}`
        },
        (payload: any) => {
          console.log('Cambio recibido en tiempo real (misión secreta):', payload.new);
          this.gameData.set(payload.new);
          this.processGameData(payload.new);
        }
      )
      .subscribe();
  }

  async validatePartnerSurprise() {
    const game = this.gameData();
    if (!game || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    let nextVal1 = game.sorpresas_validadas_1;
    let nextVal2 = game.sorpresas_validadas_2;

    if (this.isUser1) {
      nextVal2 = Math.min(nextVal2 + 1, 3);
    } else {
      nextVal1 = Math.min(nextVal1 + 1, 3);
    }

    const nextStatus = (nextVal1 === 3 && nextVal2 === 3) ? 'completed' : 'pending';

    try {
      const { data, error } = await this.supabaseService.validateMisionSecreta(
        game.id,
        nextVal1,
        nextVal2,
        nextStatus
      );

      if (error) {
        console.error('Error al validar la sorpresa:', error);
        const toast = await this.toastCtrl.create({
          message: 'Error al validar sorpresa. Inténtalo de nuevo.',
          duration: 3000,
          color: 'danger'
        });
        toast.present();
      } else {
        this.gameData.set(data);
        this.processGameData(data);

        if (nextVal1 === 3 && nextVal2 === 3) {
          await this.supabaseService.completeActivity5(1000);
          const toast = await this.toastCtrl.create({
            message: '🎉 ¡Felicidades! Han completado el Camino y ganado 1000 XP.',
            duration: 5000,
            color: 'success',
            position: 'top'
          });
          toast.present();
        } else {
          const count = this.partnerValidatedCount();
          const toast = await this.toastCtrl.create({
            message: `¡Excelente! Has confirmado ${count}/3 sorpresas de tu pareja.`,
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
