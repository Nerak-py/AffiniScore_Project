import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-trivia',
  templateUrl: './trivia.page.html',
  styleUrls: ['./trivia.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TriviaPage implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  partnerName = '';
  questionType = 0; // 0: Color, 1: Cumpleaños, 2: Sueño, 3: Lugar
  correctAnswer = '';
  userAnswer = '';
  showError = false;
  isSubmitting = false;

  ngOnInit() {
    this.generateTrivia();
  }

  generateTrivia() {
    const partner = this.supabaseService.partnerProfile();
    if (!partner || !partner.onboarding_completed) {
      // Si la pareja no ha completado el onboarding, no hay trivia
      this.router.navigate(['/tabs/path']);
      return;
    }

    this.partnerName = partner.full_name?.split(' ')[0] || 'tu pareja';
    
    // Elegimos una pregunta aleatoria basada en los datos disponibles
    this.questionType = Math.floor(Math.random() * 4);
    
    switch(this.questionType) {
      case 0: this.correctAnswer = partner.color_favorito || ''; break;
      case 1: this.correctAnswer = partner.cumpleanos || ''; break;
      case 2: this.correctAnswer = partner.sueno_infancia || ''; break;
      case 3: this.correctAnswer = partner.lugar_encuentro || ''; break;
    }
  }

  getQuestionText(): string {
    switch(this.questionType) {
      case 0: return `¿Cuál es el color favorito de ${this.partnerName}?`;
      case 1: return `¿Cuál es la fecha de cumpleaños de ${this.partnerName}?`;
      case 2: return `¿Qué quería ser ${this.partnerName} cuando era pequeño/a?`;
      case 3: return `¿Dónde se conocieron tú y ${this.partnerName}?`;
      default: return '';
    }
  }

  async verifyAnswer() {
    if (!this.userAnswer) return;

    // Comparación simple, ignorando mayúsculas y espacios
    const normalizedUser = this.userAnswer.trim().toLowerCase();
    const normalizedCorrect = this.correctAnswer.trim().toLowerCase();

    if (normalizedUser === normalizedCorrect || normalizedCorrect.includes(normalizedUser)) {
      this.showError = false;
      this.isSubmitting = true;
      
      // Completar misión, subir a Nivel 2 y otorgar XP
      await this.supabaseService.completeFirstMission();
      
      this.isSubmitting = false;
      this.router.navigate(['/tabs/path']);
    } else {
      this.showError = true;
      this.userAnswer = '';
    }
  }
}
