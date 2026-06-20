import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  heartOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trophyOutline,
  sparklesOutline,
  starOutline,
  ribbonOutline
} from 'ionicons/icons';

interface TriviaQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  category: string;
}

interface QuestionResult {
  question: string;
  correctAnswer: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-trivia',
  templateUrl: './trivia.page.html',
  styleUrls: ['./trivia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TriviaPage implements OnInit {
  public supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  partnerName = signal<string>('Tu pareja');

  // Estado del juego
  gameState = signal<'loading' | 'playing' | 'feedback' | 'finished'>('loading');
  questions = signal<TriviaQuestion[]>([]);
  currentIndex = signal<number>(0);
  results = signal<QuestionResult[]>([]);
  selectedOption = signal<string | null>(null);
  isCorrectFeedback = signal<boolean>(false);
  showConfetti = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isCompleted = signal<boolean>(false);

  // Computed values
  currentQuestion = computed(() => this.questions()[this.currentIndex()]);
  progress = computed(() => (this.currentIndex() + 1) / this.questions().length);
  totalQuestions = computed(() => this.questions().length);
  correctCount = computed(() => this.results().filter(r => r.isCorrect).length);
  xpEarned = computed(() => this.correctCount() * 15);

  // Distractores por categoría
  private colorDistractors = [
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Morado', 'Rosa', 'Naranja',
    'Negro', 'Blanco', 'Turquesa', 'Dorado', 'Plateado', 'Celeste',
    'Violeta', 'Café', 'Gris', 'Magenta', 'Coral', 'Lavanda', 'Beige'
  ];

  private dreamDistractors = [
    'Astronauta', 'Bombero/a', 'Veterinario/a', 'Doctor/a', 'Piloto',
    'Chef', 'Cantante', 'Futbolista', 'Maestro/a', 'Policía',
    'Científico/a', 'Actor/Actriz', 'Ingeniero/a', 'Bailarín/a',
    'Artista', 'Abogado/a', 'Superhéroe', 'Explorador/a', 'Escritor/a',
    'Músico/a'
  ];

  private placeDistractors = [
    'En una fiesta', 'En la universidad', 'En el trabajo', 'Por internet',
    'En un café', 'En el colegio', 'En un concierto', 'En la playa',
    'Por amigos en común', 'En un bar', 'En el gimnasio', 'En un parque',
    'En una reunión familiar', 'En el supermercado', 'En un viaje',
    'En una app de citas', 'En un evento social', 'En el transporte público',
    'En un restaurante', 'En una clase'
  ];

  // Meses en español para las fechas
  private meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      heartOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      trophyOutline,
      sparklesOutline,
      starOutline,
      ribbonOutline
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

    // Verificar si la actividad ya fue superada en Supabase (nivel >= 2)
    let completed = false;
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();
      
      if (data && data.level >= 2) {
        completed = true;
        this.isCompleted.set(true);
      }
    } catch (err) {
      console.error('Error al verificar estado de la trivia:', err);
    }

    if (!completed) {
      await this.supabaseService.checkAndUpdateActsSetupStatus();
      this.generateTrivia();
    } else {
      this.gameState.set('finished');
    }
  }

  generateTrivia() {
    const partner = this.supabaseService.partnerProfile();
    if (!partner || !partner.onboarding_completed) {
      this.router.navigate(['/tabs/path']);
      return;
    }

    this.partnerName.set(partner.full_name?.split(' ')[0] || 'tu pareja');

    const allQuestions: TriviaQuestion[] = [];
    const name = this.partnerName();

    // Pregunta: Color favorito
    if (partner.color_favorito) {
      allQuestions.push({
        question: `¿Cuál es el color favorito de ${name}?`,
        correctAnswer: partner.color_favorito,
        options: this.generateOptions(partner.color_favorito, this.colorDistractors),
        category: 'color'
      });
    }

    // Pregunta: Cumpleaños (mes)
    if (partner.cumpleanos) {
      const birthdayMonth = this.extractMonth(partner.cumpleanos);
      if (birthdayMonth) {
        allQuestions.push({
          question: `¿En qué mes cumple años ${name}?`,
          correctAnswer: birthdayMonth,
          options: this.generateOptions(birthdayMonth, this.meses),
          category: 'birthday'
        });
      }
    }

    // Pregunta: Sueño de infancia
    if (partner.sueno_infancia) {
      allQuestions.push({
        question: `¿Qué quería ser ${name} de pequeño/a?`,
        correctAnswer: partner.sueno_infancia,
        options: this.generateOptions(partner.sueno_infancia, this.dreamDistractors),
        category: 'dream'
      });
    }

    // Pregunta: Lugar de encuentro
    if (partner.lugar_encuentro) {
      allQuestions.push({
        question: `¿Dónde se conocieron tú y ${name}?`,
        correctAnswer: partner.lugar_encuentro,
        options: this.generateOptions(partner.lugar_encuentro, this.placeDistractors),
        category: 'place'
      });
    }

    // Pregunta extra: Cumpleaños (día + mes combinado)
    if (partner.cumpleanos) {
      const formattedDate = this.formatBirthday(partner.cumpleanos);
      if (formattedDate) {
        allQuestions.push({
          question: `¿Cuál es la fecha exacta de cumpleaños de ${name}?`,
          correctAnswer: formattedDate,
          options: this.generateDateOptions(formattedDate),
          category: 'birthday-exact'
        });
      }
    }

    // Pregunta extra: Color favorito (inversa)
    if (partner.color_favorito) {
      const wrongColor = this.getRandomDistractor(partner.color_favorito, this.colorDistractors);
      allQuestions.push({
        question: `¿Cuál de estos NO es el color favorito de ${name}?`,
        correctAnswer: wrongColor,
        options: this.generateInverseOptions(wrongColor, partner.color_favorito, this.colorDistractors),
        category: 'color-inverse'
      });
    }

    if (allQuestions.length < 3) {
      // No hay suficientes datos de perfil para generar la trivia
      this.router.navigate(['/tabs/path']);
      return;
    }

    // Mezclar y tomar entre 5 y 6 preguntas (o todas si hay menos)
    const shuffled = this.shuffleArray([...allQuestions]);
    const finalQuestions = shuffled.slice(0, Math.min(6, shuffled.length));

    this.questions.set(finalQuestions);
    this.currentIndex.set(0);
    this.results.set([]);
    this.selectedOption.set(null);
    this.gameState.set('playing');
  }

  selectOption(option: string) {
    if (this.gameState() !== 'playing' || this.selectedOption() !== null) return;

    const current = this.currentQuestion();
    const isCorrect = this.normalizeStr(option) === this.normalizeStr(current.correctAnswer);

    this.selectedOption.set(option);
    this.isCorrectFeedback.set(isCorrect);
    this.gameState.set('feedback');

    // Guardar resultado
    this.results.update(prev => [...prev, {
      question: current.question,
      correctAnswer: current.correctAnswer,
      selectedAnswer: option,
      isCorrect
    }]);
  }

  nextQuestion() {
    const nextIdx = this.currentIndex() + 1;

    if (nextIdx >= this.questions().length) {
      // Trivia terminada
      this.finishTrivia();
      return;
    }

    this.currentIndex.set(nextIdx);
    this.selectedOption.set(null);
    this.gameState.set('playing');
  }

  async finishTrivia() {
    this.isSubmitting.set(true);
    this.gameState.set('finished');
    this.triggerConfetti();

    try {
      // Completar misión y subir a nivel 2
      await this.supabaseService.completeFirstMission();
    } catch (err: any) {
      console.error('Error al completar la trivia:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  triggerConfetti() {
    this.showConfetti.set(true);
    setTimeout(() => {
      this.showConfetti.set(false);
    }, 6000);
  }

  goBackToPath() {
    this.router.navigate(['/tabs/path']);
  }

  getOptionClass(option: string): string {
    if (this.selectedOption() === null) return '';

    const isSelected = option === this.selectedOption();
    const isCorrectAnswer = this.normalizeStr(option) === this.normalizeStr(this.currentQuestion().correctAnswer);

    if (isCorrectAnswer) return 'correct';
    if (isSelected && !isCorrectAnswer) return 'incorrect';
    return 'dimmed';
  }

  getResultIcon(result: QuestionResult): string {
    return result.isCorrect ? 'checkmark-circle-outline' : 'close-circle-outline';
  }

  getScoreMessage(): string {
    const ratio = this.correctCount() / this.totalQuestions();
    if (ratio === 1) return '¡Perfecto! Conoces a tu pareja como nadie 💖';
    if (ratio >= 0.8) return '¡Increíble! Están muy conectados ✨';
    if (ratio >= 0.5) return '¡Bien! Pero siempre se puede conocer más 💕';
    return '¡A seguir conociéndose! El amor es un viaje 🌟';
  }

  // --- Utilidades privadas ---

  private generateOptions(correct: string, pool: string[]): string[] {
    const normalizedCorrect = this.normalizeStr(correct);
    const filtered = pool.filter(d => this.normalizeStr(d) !== normalizedCorrect);
    const distractors = this.shuffleArray(filtered).slice(0, 3);
    return this.shuffleArray([correct, ...distractors]);
  }

  private generateInverseOptions(correctWrong: string, realAnswer: string, pool: string[]): string[] {
    // En una pregunta inversa, la "respuesta correcta" es la que NO es el color favorito
    const normalizedReal = this.normalizeStr(realAnswer);
    const normalizedCorrectWrong = this.normalizeStr(correctWrong);
    const filtered = pool.filter(d =>
      this.normalizeStr(d) !== normalizedReal &&
      this.normalizeStr(d) !== normalizedCorrectWrong
    );
    // Las opciones incorrectas incluyen la respuesta real (porque SÍ es el color favorito)
    const distractorsFromPool = this.shuffleArray(filtered).slice(0, 2);
    return this.shuffleArray([correctWrong, realAnswer, ...distractorsFromPool]);
  }

  private generateDateOptions(correctDate: string): string[] {
    const dates: string[] = [correctDate];
    // Generar 3 fechas aleatorias plausibles
    for (let i = 0; i < 3; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const month = this.meses[Math.floor(Math.random() * 12)];
      const fake = `${day} de ${month}`;
      if (!dates.includes(fake)) {
        dates.push(fake);
      } else {
        // Generar otra
        const day2 = Math.floor(Math.random() * 28) + 1;
        const month2 = this.meses[Math.floor(Math.random() * 12)];
        dates.push(`${day2} de ${month2}`);
      }
    }
    return this.shuffleArray(dates).slice(0, 4);
  }

  private extractMonth(dateStr: string): string | null {
    if (!dateStr) return null;
    // Intentar parsear el formato ISO (YYYY-MM-DD) o DD/MM/YYYY
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length >= 2) {
      let monthIndex: number;
      if (dateStr.includes('-') && parts[0].length === 4) {
        // ISO: YYYY-MM-DD
        monthIndex = parseInt(parts[1], 10) - 1;
      } else {
        // DD/MM/YYYY
        monthIndex = parseInt(parts[1], 10) - 1;
      }
      if (monthIndex >= 0 && monthIndex < 12) {
        return this.meses[monthIndex];
      }
    }
    return null;
  }

  private formatBirthday(dateStr: string): string | null {
    if (!dateStr) return null;
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length >= 3) {
      let day: number, monthIndex: number;
      if (dateStr.includes('-') && parts[0].length === 4) {
        // ISO: YYYY-MM-DD
        day = parseInt(parts[2], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
      } else {
        // DD/MM/YYYY
        day = parseInt(parts[0], 10);
        monthIndex = parseInt(parts[1], 10) - 1;
      }
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} de ${this.meses[monthIndex]}`;
      }
    }
    return null;
  }

  private getRandomDistractor(exclude: string, pool: string[]): string {
    const normalizedExclude = this.normalizeStr(exclude);
    const filtered = pool.filter(d => this.normalizeStr(d) !== normalizedExclude);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  private normalizeStr(s: string): string {
    return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
