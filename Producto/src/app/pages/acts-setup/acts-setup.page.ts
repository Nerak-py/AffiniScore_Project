import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SupabaseService, AppTask } from '../../services/supabase.service';
import { addIcons } from 'ionicons';
import { 
  arrowBack, 
  heart, 
  star, 
  starOutline, 
  checkmarkCircle, 
  timeOutline, 
  send, 
  giftOutline, 
  checkmarkCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-acts-setup',
  templateUrl: './acts-setup.page.html',
  styleUrls: ['./acts-setup.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ActsSetupPage implements OnInit, OnDestroy {
  public supabase = inject(SupabaseService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  isLoading = signal<boolean>(true);
  hasSubmitted = signal<boolean>(false);
  partnerHasSubmitted = signal<boolean>(false);

  // Tareas
  myActs = signal<AppTask[]>([]); // Tareas que yo creé (que mi pareja debe hacer)
  partnerActs = signal<AppTask[]>([]); // Tareas creadas por mi pareja (que yo debo hacer)

  // Segmento activo en el panel
  activeTab = signal<'tasks' | 'requests'>('tasks');

  // Formulario Setup
  defaultSuggestions = [
    { title: 'Cortar el pasto', selected: true },
    { title: 'Hacer el supermercado', selected: true },
    { title: 'Lavar la ropa', selected: true },
    { title: 'Cocinar una cena especial', selected: true },
    { title: 'Preparar el café por la mañana', selected: true }
  ];
  customAct1 = '';
  customAct2 = '';
  isSubmitting = signal<boolean>(false);

  // Valoraciones temporales para el panel (almacena el rating seleccionado por task id)
  tempRatings: { [taskId: string]: number } = {};

  constructor() {
    addIcons({ 
      arrowBack, 
      heart, 
      star, 
      starOutline, 
      checkmarkCircle, 
      timeOutline, 
      send, 
      giftOutline, 
      checkmarkCircleOutline 
    });
  }

  async ngOnInit() {
    // Escuchar cambios de Supabase en tiempo real
    this.supabase.tasksChangedCallback = () => {
      console.log('Refrescando datos de tareas en tiempo real...');
      this.loadData();
    };

    await this.loadData();
  }

  ngOnDestroy() {
    // Limpiar el callback al salir de la pantalla
    this.supabase.tasksChangedCallback = null;
  }

  async loadData() {
    const user = this.supabase.currentUser();
    if (!user) {
      this.isLoading.set(false);
      return;
    }

    try {
      // Forzar carga de perfiles actualizados
      await this.supabase.loadUserProfile(user.id);
      const partner = this.supabase.partnerProfile();

      // 1. Obtener mis actos creados
      const { data: myData, error: err1 } = await this.supabase.getActsOfService(user.id);
      if (err1) throw err1;

      const myTasks = myData || [];
      this.myActs.set(myTasks);
      this.hasSubmitted.set(myTasks.length > 0);

      // 2. Obtener los actos de mi pareja (asignados a mí)
      const { data: partnerData, error: err2 } = await this.supabase.getTasksAssignedTo(user.id);
      if (err2) throw err2;

      const partnerTasks = partnerData || [];
      this.partnerActs.set(partnerTasks);

      // El partner ha enviado sus peticiones si tiene tareas asignadas a mí
      this.partnerHasSubmitted.set(partnerTasks.length > 0);

      // Inicializar ratings temporales para tareas completadas que aún no se han calificado
      myTasks.forEach(task => {
        if (task.status === 'completed' && !this.tempRatings[task.id]) {
          this.tempRatings[task.id] = 5; // Por defecto 5 estrellas
        }
      });

      // 3. Si AMBOS han enviado sus peticiones, el estado cambia localmente pero el nivel se mantiene en 0 para permitir la fase de ejecución
      if (myTasks.length > 0 && partnerTasks.length > 0) {
        console.log('Ambas parejas han enviado sus peticiones. Actividad 1 en progreso de ejecución (nivel 0).');
      }
    } catch (error) {
      console.error('Error cargando actos de servicio:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/tabs/path']);
  }

  async submitSetup() {
    const partner = this.supabase.partnerProfile();
    const user = this.supabase.currentUser();
    if (!user || !partner) {
      const toast = await this.toastController.create({
        message: 'Debes estar vinculado con tu pareja para enviar peticiones.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Recolectar sugerencias seleccionadas
    const selectedSuggestions = this.defaultSuggestions
      .filter(s => s.selected)
      .map(s => ({ title: s.title, is_custom: false, assigned_to: partner.id }));

    // Recolectar personalizadas
    const customActs = [];
    if (this.customAct1.trim() !== '') {
      customActs.push({ title: this.customAct1.trim(), is_custom: true, assigned_to: partner.id });
    }
    if (this.customAct2.trim() !== '') {
      customActs.push({ title: this.customAct2.trim(), is_custom: true, assigned_to: partner.id });
    }

    const allActs = [...selectedSuggestions, ...customActs];

    if (allActs.length !== 5) {
      const toast = await this.toastController.create({
        message: 'Debes seleccionar y/o escribir exactamente 5 actos de servicio en total.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isSubmitting.set(true);
    const { error } = await this.supabase.saveActsOfService(allActs);
    this.isSubmitting.set(false);

    if (error) {
      const toast = await this.toastController.create({
        message: 'Error al guardar tus actos de servicio: ' + error.message,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } else {
      const toast = await this.toastController.create({
        message: '¡Tus actos de servicio han sido enviados a tu pareja!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      await this.loadData();
    }
  }

  async markAsDone(task: AppTask) {
    this.isLoading.set(true);
    const { error } = await this.supabase.updateTaskStatus(task.id, 'completed');
    this.isLoading.set(false);

    if (error) {
      console.error('Error al actualizar tarea:', error);
    } else {
      const toast = await this.toastController.create({
        message: 'Tarea marcada como completada. Esperando valoración de tu pareja.',
        duration: 2500,
        color: 'success'
      });
      await toast.present();
      await this.loadData();
    }
  }

  setTempRating(taskId: string, rating: number) {
    this.tempRatings[taskId] = rating;
  }

  getTempRating(taskId: string): number {
    return this.tempRatings[taskId] || 5;
  }

  async rateTask(task: AppTask) {
    const rating = this.getTempRating(task.id);
    const partner = this.supabase.partnerProfile();
    if (!partner) return;

    this.isLoading.set(true);
    const result = await this.supabase.validateAndRateTask(task.id, rating, partner.id);
    this.isLoading.set(false);

    if (result.success) {
      const toast = await this.toastController.create({
        message: `¡Tarea calificada con ${rating} estrellas! Tu pareja ganó +${rating * 10} XP.`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();
      await this.loadData();
    } else {
      const toast = await this.toastController.create({
        message: 'Hubo un error al guardar la valoración.',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
