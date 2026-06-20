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
  syncOutline,
  checkmarkCircleOutline,
  timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-ruleta',
  templateUrl: './ruleta.page.html',
  styleUrls: ['./ruleta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RuletaPage implements OnInit, OnDestroy {
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  challenges: string[] = [
    'Masaje de 10 minutos',
    'Beso de película',
    'Quitar una prenda',
    'Decir un secreto candente',
    'Un baile atrevido',
    'Susurrar algo al oído'
  ];

  gameState = signal<'loading' | 'active'>('loading');
  gameData = signal<any>(null);
  partnerName = signal<string>('Tu pareja');
  isSpinning = signal<boolean>(false);
  wheelRotation = signal<number>(0);
  showConfetti = signal<boolean>(false);
  
  myUserId: string = '';
  partnerId: string = '';
  private realtimeChannel: any = null;

  constructor() {
    addIcons({
      arrowBackOutline,
      sparklesOutline,
      trophyOutline,
      heartOutline,
      syncOutline,
      checkmarkCircleOutline,
      timeOutline
    });
  }

  async ngOnInit() {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.myUserId = user.id;

    // Asegurar que los perfiles estén cargados
    if (!this.supabaseService.userProfile()) {
      await this.supabaseService.loadUserProfile(user.id);
    }

    const partner = this.supabaseService.partnerProfile();
    if (partner) {
      this.partnerId = partner.id;
      this.partnerName.set(partner.full_name?.split(' ')[0] || 'Tu pareja');
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Debes estar vinculado con tu pareja para jugar.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      this.router.navigate(['/tabs/path']);
      return;
    }

    await this.loadGame();
  }

  async loadGame() {
    this.gameState.set('loading');
    try {
      const { data, error } = await this.supabaseService.initializeRuletaGame(this.myUserId, this.partnerId);
      if (error) throw error;
      
      this.gameData.set(data);
      this.gameState.set('active');
      this.setupRealtimeSubscription();
    } catch (err: any) {
      console.error('Error al inicializar juego de ruleta:', err);
      const toast = await this.toastCtrl.create({
        message: 'Error al conectar con la base de datos: ' + (err.message || err),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/tabs/path']);
    }
  }

  setupRealtimeSubscription() {
    if (!this.gameData() || this.realtimeChannel) return;

    const gameId = this.gameData().id;
    console.log(`Subscribiéndose en tiempo real a la ruleta con id ${gameId}...`);

    this.realtimeChannel = this.supabaseService.client
      .channel(`public:ruleta_game:couple:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ruleta_game',
          filter: `id=eq.${gameId}`
        },
        async (payload: any) => {
          console.log('Cambio detectado en ruleta_game (realtime):', payload);
          if (payload.new) {
            const oldStatus = this.gameData()?.status;
            this.gameData.set(payload.new);
            
            // Si el estado pasó a 'completed' o 'finished' y antes no lo estaba, mostrar confeti
            if ((payload.new.status === 'completed' || payload.new.status === 'finished') && oldStatus !== payload.new.status) {
              this.triggerConfetti();
            }
          }
        }
      )
      .subscribe();
  }

  async spin() {
    if (this.isSpinning() || !this.isMyTurn()) return;

    this.isSpinning.set(true);
    
    // Elegimos un índice al azar de retos (0 a 5)
    const randomIndex = Math.floor(Math.random() * this.challenges.length);
    const selectedChallenge = this.challenges[randomIndex];

    // Cada sección es de 60 grados.
    // Queremos que se detenga centrado en la sección randomIndex.
    // Angulo = 360 - (index * 60) - 30 (ajustando la aguja de arriba).
    // Agregamos 5 giros completos (1800 grados) para el efecto dramático.
    const degreesPerSection = 360 / this.challenges.length;
    const targetAngle = 360 - (randomIndex * degreesPerSection) - (degreesPerSection / 2);
    const totalRotation = 1800 + targetAngle;

    this.wheelRotation.set(totalRotation);

    // Esperamos 3.5 segundos a que termine la animación
    setTimeout(async () => {
      try {
        const { data, error } = await this.supabaseService.updateRuletaSpin(this.gameData().id, selectedChallenge);
        if (error) throw error;
        
        this.gameData.set(data);
      } catch (err: any) {
        console.error('Error al guardar reto de ruleta:', err);
      } finally {
        this.isSpinning.set(false);
      }
    }, 3500);
  }

  async validate() {
    if (!this.isWaitingForValidation()) return;

    try {
      let userSpins = this.gameData().user_spins || 0;
      let partnerSpins = this.gameData().partner_spins || 0;

      // Incrementar el contador de giros de quien ejecutó el reto
      // Quien ejecutó el reto es quien tenía el turno (turn_id)
      if (this.gameData().turn_id === this.gameData().user_id) {
        userSpins++;
      } else {
        partnerSpins++;
      }

      let nextTurnId = this.myUserId; // Por defecto alterna al validador (yo)
      let isFinished = false;

      if (userSpins >= 3 && partnerSpins >= 3) {
        isFinished = true;
      } else if (userSpins >= 3) {
        // Turno para partner_id ya que user_id ya completó sus 3 giros
        nextTurnId = this.gameData().partner_id;
      } else if (partnerSpins >= 3) {
        // Turno para user_id ya que partner_id ya completó sus 3 giros
        nextTurnId = this.gameData().user_id;
      }

      const { data, error } = await this.supabaseService.validateRuletaChallenge(
        this.gameData().id,
        nextTurnId,
        userSpins,
        partnerSpins,
        isFinished
      );
      if (error) throw error;

      this.gameData.set(data);
      
      // Si el juego ha finalizado, marcar la actividad como completada y otorgar 200 XP
      if (isFinished) {
        await this.supabaseService.completeActivity4(200);
      }

      this.triggerConfetti();
    } catch (err: any) {
      console.error('Error al validar reto:', err);
      const toast = await this.toastCtrl.create({
        message: 'Error al validar el reto: ' + (err.message || err),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  triggerConfetti() {
    this.showConfetti.set(true);
    setTimeout(() => {
      this.showConfetti.set(false);
    }, 6000);
  }

  getMySpinsCount(): number {
    if (!this.gameData()) return 0;
    return this.myUserId === this.gameData().user_id 
      ? (this.gameData().user_spins || 0) 
      : (this.gameData().partner_spins || 0);
  }

  getPartnerSpinsCount(): number {
    if (!this.gameData()) return 0;
    return this.myUserId === this.gameData().user_id 
      ? (this.gameData().partner_spins || 0) 
      : (this.gameData().user_spins || 0);
  }

  isMyTurn(): boolean {
    if (!this.gameData()) return false;
    if (this.gameData().status === 'finished') return false;
    if (this.getMySpinsCount() >= 3) return false;
    return this.gameData().turn_id === this.myUserId;
  }

  isWaitingForValidation(): boolean {
    if (!this.gameData()) return false;
    if (this.gameData().status === 'finished') return false;
    // Es mi turno de validar si NO es mi turno de girar, y hay un reto pendiente en pantalla
    return !this.isMyTurn() && this.gameData().challenge !== null && this.gameData().status === 'pending';
  }

  goBackToPath() {
    this.router.navigate(['/tabs/path']);
  }

  cleanupSubscription() {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  ngOnDestroy() {
    this.cleanupSubscription();
  }
}
