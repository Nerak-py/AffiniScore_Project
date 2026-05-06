import { Component, inject } from '@angular/core';
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

  nodes: ActivityNode[] = [
    { id: 1, title: 'Nuestra Historia', type: 'trivia', points: 50, status: 'completed', x: 30, y: 100 },
    { id: 2, title: '¿Dónde fue esto?', type: 'photo', points: 75, status: 'completed', x: 70, y: 250 },
    { id: 3, title: 'Gesto de Ternura', type: 'gesture', points: 30, status: 'current', x: 40, y: 400 },
    { id: 4, title: 'Trivia Picante', type: 'trivia', points: 100, status: 'locked', x: 75, y: 550 },
    { id: 5, title: 'Adivina el Lugar', type: 'photo', points: 80, status: 'locked', x: 35, y: 700 },
    { id: 6, title: 'Abrazo de 30s', type: 'gesture', points: 40, status: 'locked', x: 65, y: 850 },
    { id: 7, title: '¡Meta Semanal!', type: 'meta', points: 500, status: 'locked', x: 50, y: 1000 },
  ];

  pathD = '';

  constructor() {
    addIcons({ flame, heart, star, image, lockClosed, sparkles, chatbubbles });
    this.generatePath();
  }

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  generatePath() {
    this.pathD = this.nodes.reduce((acc, node, i) => {
      if (i === 0) return `M ${node.x} ${node.y}`;
      const prev = this.nodes[i - 1];
      const cpX = i % 2 === 0 ? 10 : 90; 
      // Calculamos las posiciones x absolutas para el viewBox de "0 0 100 1200"
      return `${acc} Q ${cpX} ${(prev.y + node.y) / 2} ${node.x} ${node.y}`;
    }, '');
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
    if (node.status === 'locked') return;
    console.log('Nodo clickeado:', node);
    // Aquí iría la lógica para abrir el modal del nodo
  }
}
