import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface Dialogue {
  text: string;
  emotion: 'feliz' | 'hablando' | 'pensativo';
}

@Component({
  selector: 'app-intro-cutscene',
  templateUrl: './intro-cutscene.component.html',
  styleUrls: ['./intro-cutscene.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class IntroCutsceneComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  dialogues: Dialogue[] = [
    { text: '¡Hola! Bienvenidos a AffiniScore.', emotion: 'feliz' },
    { text: 'Mi nombre es Afi, y seré su guía en este gimnasio emocional para su relación.', emotion: 'hablando' },
    { text: 'Aquí podrán superar la monotonía completando misiones diarias, respondiendo trivias y acumulando rachas juntos.', emotion: 'pensativo' },
    { text: 'Para empezar, vinculemos tu cuenta con la de tu pareja. ¡Vamos allá!', emotion: 'feliz' }
  ];

  currentIndex = 0;
  displayedText = '';
  isTyping = false;
  
  private timer: any = null;
  private typingSpeed = 40; // ms

  ngOnInit() {
    this.startDialogue();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startDialogue() {
    this.clearTimer();
    this.displayedText = '';
    this.isTyping = true;
    
    const currentDialogue = this.dialogues[this.currentIndex].text;
    let charIndex = 0;

    this.timer = setInterval(() => {
      if (charIndex < currentDialogue.length) {
        this.displayedText += currentDialogue.charAt(charIndex);
        charIndex++;
      } else {
        this.finishTyping();
      }
    }, this.typingSpeed);
  }

  finishTyping() {
    this.clearTimer();
    this.displayedText = this.dialogues[this.currentIndex].text;
    this.isTyping = false;
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getCharacterImage(): string {
    const currentDialogue = this.dialogues[this.currentIndex];
    return `assets/images/afi_${currentDialogue.emotion}.png`;
  }

  onImageError(event: any) {
    const target = event.target as HTMLImageElement;
    if (target.src !== 'assets/images/afi.png' && !target.src.endsWith('/assets/images/afi.png')) {
      target.src = 'assets/images/afi.png';
    }
  }

  onScreenClick() {
    if (this.isTyping) {
      this.finishTyping();
    } else {
      if (this.currentIndex < this.dialogues.length - 1) {
        this.currentIndex++;
        this.startDialogue();
      } else {
        this.router.navigate(['/couple-link']);
      }
    }
  }
}
