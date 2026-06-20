import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonContent, IonIcon } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { flame, heart, star, image, lockClosed, sparkles, chatbubbles } from 'ionicons/icons';
import { SpotlightService } from '../../services/spotlight.service';

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
  imports: [CommonModule, IonHeader, IonToolbar, IonContent, IonIcon]
})
export class PathPage {
  supabase = inject(SupabaseService);
  router = inject(Router);
  spotlight = inject(SpotlightService);

  async ionViewWillEnter() {
    const user = this.supabase.currentUser();
    if (user) {
      await this.supabase.loadUserProfile(user.id);
      await this.supabase.checkAndUpdateActsSetupStatus();
    }
  }

  isFirstLockedNode(node: ActivityNode): boolean {
    if (this.spotlight.showOverlay() && this.spotlight.currentStep() === 1) {
      const firstLocked = this.nodes().find(n => n.status === 'locked');
      return firstLocked ? firstLocked.id === node.id : false;
    }
    return false;
  }

  getNodeStatus(nodeId: number, level: number, isLinked: boolean): 'locked' | 'current' | 'completed' {
    if (!isLinked) return 'locked';
    if (level >= nodeId) {
      return 'completed';
    } else if (level === nodeId - 1) {
      return 'current';
    } else {
      return 'locked';
    }
  }

  nodes = computed<ActivityNode[]>(() => {
    const profile = this.supabase.userProfile();
    const score = this.supabase.userScore();
    const isLinked = !!profile?.couple_id;
    const level = score?.level || 0;

    const nodesData = [
      { id: 1, title: 'Actos de servicio', type: 'gesture', points: 50, x: 30, y: 100 },
      { id: 2, title: 'Trivia de Pareja', type: 'trivia', points: 30, x: 70, y: 250 },
      { id: 3, title: '¿Quién es más probable?', type: 'trivia', points: 75, x: 40, y: 400 },
      { id: 4, title: 'La Ruleta Picante', type: 'gesture', points: 100, x: 75, y: 550 },
      { id: 5, title: 'Misión Secreta', type: 'gesture', points: 1000, x: 35, y: 700 },
      { id: 6, title: 'Buzon romantico', type: 'gesture', points: 1000, x: 65, y: 850 },
      { id: 7, title: '¡Meta Semanal!', type: 'meta', points: 500, x: 50, y: 1000 },
    ];

    return nodesData.map(node => ({
      ...node,
      status: this.getNodeStatus(node.id, level, isLinked)
    })) as ActivityNode[];
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
    console.log('onNodeClick triggered for node:', node);
    if (node.status === 'locked') {
      console.log('Nodo bloqueado:', node.title);
      return;
    }

    if (node.id === 1) {
      console.log('Navigating to /acts-setup');
      this.router.navigate(['/acts-setup']);
      return;
    }
    
    if (node.id === 2) {
      console.log('Navigating to /trivia');
      this.router.navigate(['/trivia']);
      return;
    }
    
    if (node.id === 3) {
      console.log('Navigating to /most-likely');
      this.router.navigate(['/most-likely']).then(
        success => console.log('Navigation success:', success),
        err => {
          console.error('Navigation error:', err);
          alert('Navigation error: ' + JSON.stringify(err));
        }
      );
      return;
    }

    if (node.id === 4) {
      console.log('Navigating to /ruleta');
      this.router.navigate(['/ruleta']).then(
        success => console.log('Navigation success:', success),
        err => {
          console.error('Navigation error:', err);
          alert('Navigation error: ' + JSON.stringify(err));
        }
      );
      return;
    }

    if (node.id === 5) {
      console.log('Navigating to /mision-secreta');
      this.router.navigate(['/mision-secreta']).then(
        success => console.log('Navigation success:', success),
        err => {
          console.error('Navigation error:', err);
          alert('Navigation error: ' + JSON.stringify(err));
        }
      );
      return;
    }

    if (node.id === 6) {
      console.log('Navigating to /buzon-romantico');
      this.router.navigate(['/buzon-romantico']).then(
        success => console.log('Navigation success:', success),
        err => {
          console.error('Navigation error:', err);
          alert('Navigation error: ' + JSON.stringify(err));
        }
      );
      return;
    }

    if (node.id === 7) {
      console.log('Navigating to /actividad7');
      this.router.navigate(['/actividad7']).then(
        success => console.log('Navigation success:', success),
        err => {
          console.error('Navigation error:', err);
          alert('Navigation error: ' + JSON.stringify(err));
        }
      );
      return;
    }
  }
}
