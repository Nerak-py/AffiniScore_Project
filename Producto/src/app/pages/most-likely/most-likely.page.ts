import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  heartOutline,
  starOutline,
  chevronForwardOutline,
  chevronBackOutline,
  arrowBackOutline,
  sparklesOutline,
  trophyOutline,
  happyOutline,
  sadOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-most-likely',
  templateUrl: './most-likely.page.html',
  styleUrls: ['./most-likely.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MostLikelyPage implements OnInit, OnDestroy {
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  questions = [
    '¿Quién es más probable que queme la cena?',
    '¿Quién es más probable que se quede dormido en el cine?',
    '¿Quién es más probable que pierda las llaves?',
    '¿Quién es más probable que llore en una película?',
    '¿Quién es más probable que gaste dinero en algo inútil?',
    '¿Quién es más probable que inicie una discusión o conversación difícil?',
    '¿Quién es más probable que se pierda conduciendo?',
    '¿Quién es más probable que planee la próxima cita?',
    '¿Quién es más probable que sea el primero en pedir disculpas?',
    '¿Quién es más probable que sobreviva en una isla desierta?'
  ];

  currentQuestionIndex = signal<number>(0);
  answers = signal<string[]>(new Array(10).fill(''));
  gameState = signal<'loading' | 'playing' | 'waiting' | 'results'>('loading');
  
  myAnswers = signal<string[]>([]);
  partnerAnswers = signal<string[]>([]);
  partnerName = signal<string>('Tu pareja');
  
  matchesCount = signal<number>(0);
  xpEarned = signal<number>(0);
  isSubmitting = signal<boolean>(false);
  
  private partnerChannel: any = null;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      heartOutline,
      starOutline,
      chevronForwardOutline,
      chevronBackOutline,
      arrowBackOutline,
      sparklesOutline,
      trophyOutline,
      happyOutline,
      sadOutline
    });
  }

  async ngOnInit() {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Asegurar que los perfiles estén cargados
    if (!this.supabaseService.userProfile()) {
      await this.supabaseService.loadUserProfile(user.id);
    }

    const partner = this.supabaseService.partnerProfile();
    if (partner) {
      this.partnerName.set(partner.full_name?.split(' ')[0] || 'Tu pareja');
    }

    await this.loadGameData();
  }

  async loadGameData() {
    const user = this.supabaseService.currentUser();
    if (!user) return;

    this.gameState.set('loading');

    try {
      // 1. Cargar mis respuestas
      const { data: myData } = await this.supabaseService.getMostLikelyAnswers(user.id);
      if (myData && myData.answers) {
        this.myAnswers.set(myData.answers);
        this.answers.set([...myData.answers]);
      }

      // 2. Cargar respuestas de mi pareja
      const partner = this.supabaseService.partnerProfile();
      if (partner) {
        const { data: partnerData } = await this.supabaseService.getMostLikelyAnswers(partner.id);
        if (partnerData && partnerData.answers) {
          this.partnerAnswers.set(partnerData.answers);
        }
      }

      // 3. Determinar estado del juego
      if (this.myAnswers().length > 0) {
        if (this.partnerAnswers().length > 0) {
          // Ambos respondieron
          this.calculateMatches();
          // Asegurar nivel 3 y XP
          await this.supabaseService.completeActivity3(this.xpEarned());
          this.gameState.set('results');
        } else {
          // Yo respondí, pero mi pareja no
          this.gameState.set('waiting');
          this.setupRealtimeSubscription();
        }
      } else {
        // Yo no he respondido aún
        this.gameState.set('playing');
      }
    } catch (err) {
      console.error('Error al cargar datos del juego:', err);
      const toast = await this.toastCtrl.create({
        message: 'Error de conexión. Inténtalo de nuevo.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.gameState.set('playing');
    }
  }

  selectAnswer(choice: 'me' | 'partner') {
    const currentIdx = this.currentQuestionIndex();
    const updatedAnswers = [...this.answers()];
    updatedAnswers[currentIdx] = choice;
    this.answers.set(updatedAnswers);

    if (currentIdx < 9) {
      this.currentQuestionIndex.set(currentIdx + 1);
    } else {
      this.submitAnswers();
    }
  }

  prevQuestion() {
    const currentIdx = this.currentQuestionIndex();
    if (currentIdx > 0) {
      this.currentQuestionIndex.set(currentIdx - 1);
    }
  }

  nextQuestion() {
    const currentIdx = this.currentQuestionIndex();
    if (currentIdx < 9 && this.answers()[currentIdx] !== '') {
      this.currentQuestionIndex.set(currentIdx + 1);
    }
  }

  async submitAnswers() {
    this.isSubmitting.set(true);
    const user = this.supabaseService.currentUser();
    if (!user) return;

    try {
      const { error } = await this.supabaseService.saveMostLikelyAnswers(this.answers());
      if (error) throw error;

      this.myAnswers.set([...this.answers()]);

      // Volver a consultar las respuestas de la pareja por si acaso acabó mientras jugábamos
      const partner = this.supabaseService.partnerProfile();
      if (partner) {
        const { data: partnerData } = await this.supabaseService.getMostLikelyAnswers(partner.id);
        if (partnerData && partnerData.answers) {
          this.partnerAnswers.set(partnerData.answers);
        }
      }

      if (this.partnerAnswers().length > 0) {
        this.calculateMatches();
        await this.supabaseService.completeActivity3(this.xpEarned());
        this.gameState.set('results');
      } else {
        this.gameState.set('waiting');
        this.setupRealtimeSubscription();
      }
    } catch (err: any) {
      console.error('Error al guardar respuestas:', err);
      const toast = await this.toastCtrl.create({
        message: 'Error al guardar tus respuestas: ' + (err.message || err),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  calculateMatches() {
    const mine = this.myAnswers();
    const theirs = this.partnerAnswers();
    let matches = 0;

    for (let i = 0; i < 10; i++) {
      const myAns = mine[i];
      const partnerAns = theirs[i];

      // Coincidencia matemática: Yo digo "Yo" y mi pareja dice "Mi pareja",
      // o yo digo "Mi pareja" y mi pareja dice "Yo".
      if (
        (myAns === 'me' && partnerAns === 'partner') ||
        (myAns === 'partner' && partnerAns === 'me')
      ) {
        matches++;
      }
    }

    this.matchesCount.set(matches);
    this.xpEarned.set(250);
  }

  setupRealtimeSubscription() {
    const partner = this.supabaseService.partnerProfile();
    if (!partner || this.partnerChannel) return;

    console.log('Esperando respuestas de la pareja. Suscribiéndose en tiempo real...');

    this.partnerChannel = this.supabaseService.client
      .channel(`public:most_likely_answers:partner:${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'most_likely_answers',
          filter: `user_id=eq.${partner.id}`
        },
        async (payload: any) => {
          console.log('Cambio detectado en las respuestas de la pareja:', payload);
          if (payload.new && payload.new.answers) {
            this.partnerAnswers.set(payload.new.answers);
            
            // Ambos han respondido ahora
            this.calculateMatches();
            await this.supabaseService.completeActivity3(this.xpEarned());
            this.gameState.set('results');
            
            // Limpiar suscripción
            this.cleanupSubscription();
          }
        }
      )
      .subscribe();
  }

  cleanupSubscription() {
    if (this.partnerChannel) {
      this.supabaseService.client.removeChannel(this.partnerChannel);
      this.partnerChannel = null;
    }
  }

  goBackToPath() {
    this.router.navigate(['/tabs/path']);
  }

  ngOnDestroy() {
    this.cleanupSubscription();
  }
}
