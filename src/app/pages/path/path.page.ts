import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonContent, IonBadge, IonIcon, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { flame, heart, star, image, lockClosed, sparkles, chatbubbles } from 'ionicons/icons';

type ActivityType = 'trivia' | 'photo' | 'gesture' | 'locked' | 'meta';

export interface ActivityNode {
  id: number;
  title: string;
  type: ActivityType;
  points: number;
  status: 'completed' | 'current' | 'locked';
  x: number; // Porcentaje del ancho
  y: number; // Posición Y en píxeles
}

@Component({
  selector: 'app-path',
  templateUrl: './path.page.html',
  styleUrls: ['./path.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonContent, IonBadge, IonIcon, IonFab, IonFabButton]
})
export class PathPage {
  supabase = inject(SupabaseService);
  router = inject(Router);

  nodes = computed<ActivityNode[]>(() => {
    const profile = this.supabase.userProfile();
    const partner = this.supabase.partnerProfile();
    const score = this.supabase.userScore();
    const isLinked = !!profile?.couple_id;
    const level = score?.level || 0;

    let node1Status: 'locked' | 'current' | 'completed' = 'locked';
    let node1Title = '¡Vincula con tu pareja para empezar la trivia!';

    if (isLinked) {
      if (!partner?.onboarding_completed) {
        node1Status = 'locked';
        node1Title = 'Tu pareja aún no responde sus preguntas iniciales';
      } else {
        if (level === 0) {
          node1Status = 'current';
          node1Title = '¡Trivia disponible!';
        } else {
          node1Status = 'completed';
          node1Title = 'Nuestra Historia (Completada)';
        }
      }
    }

    // Definición base de los nodos
    return [
      { id: 1, title: node1Title, type: 'trivia', points: 50, status: node1Status, x: 30, y: 100 },
      { id: 2, title: '¿Dónde fue esto?', type: 'photo', points: 75, status: isLinked && level >= 1 ? (level === 1 ? 'current' : 'completed') : 'locked', x: 70, y: 250 },
      { id: 3, title: 'Gesto de Ternura', type: 'gesture', points: 30, status: isLinked && level >= 2 ? (level === 2 ? 'current' : 'completed') : 'locked', x: 40, y: 400 },
      { id: 4, title: 'Trivia Picante', type: 'trivia', points: 100, status: 'locked', x: 75, y: 550 },
      { id: 5, title: 'Adivina el Lugar', type: 'photo', points: 80, status: 'locked', x: 35, y: 700 },
      { id: 6, title: 'Abrazo de 30s', type: 'gesture', points: 40, status: 'locked', x: 65, y: 850 },
      { id: 7, title: '¡Meta Semanal!', type: 'meta', points: 500, status: 'locked', x: 50, y: 1000 },
    ];
  });

  pathD = computed(() => {
    const nodesArr = this.nodes();
    return nodesArr.reduce((acc, node, i) => {
      if (i === 0) return `M ${node.x} ${node.y}`;
      const prev = nodesArr[i - 1];
      const cpX = i % 2 === 0 ? 10 : 90; 
      return `${acc} Q ${cpX} ${(prev.y + node.y) / 2} ${node.x} ${node.y}`;
    }, '');
  });

  constructor() {
    addIcons({ flame, heart, star, image, lockClosed, sparkles, chatbubbles });
  }

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }



  getIconName(type: ActivityType, status: string): string {
    if (status === 'locked') return 'lock-closed';
    switch (type) {
      case 'trivia': return 'chatbubbles';
      case 'photo': return 'image';
      case 'gesture': return 'heart';
      case 'meta': return 'sparkles';
      default: return 'star';
    }
  }

  onNodeClick(node: ActivityNode) {
    if (node.status === 'locked') {
      console.log('Nodo bloqueado:', node.title);
      return;
    }
    
    if (node.id === 1 && node.status === 'current') {
      this.router.navigate(['/trivia']);
    }
  }
}
