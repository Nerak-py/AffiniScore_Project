import { Component, EnvironmentInjector, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { map, person, chatbubbles, gift } from 'ionicons/icons';
import { SpotlightService } from '../services/spotlight.service';

interface DialogueStep {
  text: string;
  image: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  private router = inject(Router);
  public spotlight = inject(SpotlightService);

  // Lógica del Overlay de Vinculación de Afi
  showLinkingOverlay = false;
  currentStep = 0;
  displayedText = '';
  isTyping = false;
  private timer: any = null;
  private typingSpeed = 40; // ms

  steps: DialogueStep[] = [
    {
      text: '¡Bien hecho! Ahora que tenemos más detalles podremos personalizar mucho mejor tu experiencia.',
      image: 'assets/images/afi.feliz.png'
    },
    {
      text: '¡Vaya!, aún no está la actividad desbloqueada, ¡tienes que vincular con tu pareja!',
      image: 'assets/images/afi.pensativo.png'
    },
    {
      text: '¡Pincha aquí mismo para vincular!',
      image: 'assets/images/afi.png'
    }
  ];

  constructor() {
    addIcons({ map, person, chatbubbles, gift });
  }

  ngOnInit() {
    this.checkPendingCutscene();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  checkPendingCutscene() {
    if (localStorage.getItem('pending_linking_cutscene') === 'true') {
      this.showLinkingOverlay = true;
      this.spotlight.showOverlay.set(true);
      this.currentStep = 0;
      this.spotlight.currentStep.set(0);
      this.startDialogue();
    }
  }

  startDialogue() {
    this.clearTimer();
    this.displayedText = '';
    this.isTyping = true;
    
    const currentDialogue = this.steps[this.currentStep].text;
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
    this.displayedText = this.steps[this.currentStep].text;
    this.isTyping = false;
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onImageError(event: any) {
    const target = event.target as HTMLImageElement;
    if (target.src !== 'assets/images/afi.png' && !target.src.endsWith('/assets/images/afi.png')) {
      target.src = 'assets/images/afi.png';
    }
  }

  onOverlayClick(event: Event) {
    event.stopPropagation();
    if (this.isTyping) {
      this.finishTyping();
    } else {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        this.spotlight.currentStep.set(this.currentStep);
        this.startDialogue();
      } else {
        // En el paso 3, si hacen clic en el overlay, navegamos a Perfil
        this.navigateToProfile();
      }
    }
  }

  onProfileClick() {
    if (this.showLinkingOverlay && this.currentStep === 2) {
      this.closeOverlay();
    }
  }

  navigateToProfile() {
    this.closeOverlay();
    this.router.navigate(['/tabs/profile']);
  }

  closeOverlay() {
    this.showLinkingOverlay = false;
    this.spotlight.showOverlay.set(false);
    this.spotlight.currentStep.set(-1);
    localStorage.removeItem('pending_linking_cutscene');
    this.clearTimer();
  }
}
