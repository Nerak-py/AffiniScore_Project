import { Injectable, signal, NgZone } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface UserScore {
  xp: number;
  hearts: number;
  streak: number;
  level: number;
}

export interface UserProfile {
  id: string;
  couple_id: string | null;
  couple_code: string;
  full_name?: string;
  onboarding_completed?: boolean;
  color_favorito?: string;
  cumpleanos?: string;
  sueno_infancia?: string;
  lugar_encuentro?: string;
  genero?: string;
  pronombre_preferido?: string;
  xp?: number;
  hearts?: number;
  streak?: number;
  level?: number;
}

export interface AppTask {
  id: string;
  created_at: string;
  user_id: string;
  assigned_to?: string;
  type: string;
  title: string;
  status: 'pending' | 'completed' | 'validated';
  rating?: number;
  xp_awarded?: number;
  is_custom: boolean;
  metadata?: any;
}


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  public get client() {
    return this.supabase;
  }
  // Estado Reactivo con Signals
  currentUser = signal<User | null>(null);
  userScore = signal<UserScore>({ xp: 0, hearts: 5, streak: 0, level: 0 });
  userProfile = signal<UserProfile | null>(null);
  partnerProfile = signal<UserProfile | null>(null);
  actsSetupComplete = signal<boolean>(false);
  actsExecutionComplete = signal<boolean>(false);

  constructor(private ngZone: NgZone) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.handleSession(session?.user);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.handleSession(session?.user);
    });
  }

  private async handleSession(user: User | undefined | null) {
    this.currentUser.set(user ?? null);
    if (user) {
      await this.loadUserScore(user.id);
      await this.loadUserProfile(user.id);
      this.setupRealtimeSubscription(user.id);
      this.setupScoresRealtimeSubscription(user.id);
      this.setupTasksRealtimeSubscription();
    } else {
      this.userProfile.set(null);
      this.partnerProfile.set(null);
      if (this.partnerChannel) {
        this.supabase.removeChannel(this.partnerChannel);
        this.partnerChannel = null;
      }
      if (this.tasksChannel) {
        this.supabase.removeChannel(this.tasksChannel);
        this.tasksChannel = null;
      }
      if (this.scoresChannel) {
        this.supabase.removeChannel(this.scoresChannel);
        this.scoresChannel = null;
      }
    }
  }

  private activeChannel: any = null;
  private partnerChannel: any = null;
  private tasksChannel: any = null;
  private scoresChannel: any = null;
  tasksChangedCallback: (() => void) | null = null;

  setupRealtimeSubscription(userId: string) {
    if (!this.supabase) return;
    
    if (this.activeChannel) {
      this.supabase.removeChannel(this.activeChannel);
    }

    this.activeChannel = this.supabase.channel('public:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('Cambio detectado en Supabase (Realtime):', payload);
          this.ngZone.run(() => {
            this.loadUserProfile(userId); // Recargar datos si detecta cambios desde el otro usuario
          });
        }
      )
      .subscribe();
  }

  setupScoresRealtimeSubscription(userId: string) {
    if (!this.supabase) return;

    if (this.scoresChannel) {
      this.supabase.removeChannel(this.scoresChannel);
    }

    this.scoresChannel = this.supabase.channel('public:scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('Cambio detectado en profiles para Scores (Realtime):', payload);
          this.ngZone.run(() => {
            if (payload.new) {
              const record = payload.new as any;
              this.userScore.set({
                xp: record.xp ?? 0,
                hearts: record.hearts ?? 5,
                streak: record.streak ?? 0,
                level: record.level ?? 0
              });
            }
          });
        }
      )
      .subscribe();
  }

  setupPartnerRealtimeSubscription(partnerId: string) {
    if (!this.supabase || !partnerId) return;

    if (this.partnerChannel) {
      this.supabase.removeChannel(this.partnerChannel);
    }

    this.partnerChannel = this.supabase.channel(`public:profiles:partner:${partnerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` },
        (payload) => {
          console.log('Cambio detectado en perfil de la pareja (Realtime):', payload);
          this.ngZone.run(() => {
            const user = this.currentUser();
            if (user) {
              this.loadPartnerProfile(partnerId, user.id);
            }
          });
        }
      )
      .subscribe();
  }

  setupTasksRealtimeSubscription() {
    if (!this.supabase) return;

    if (this.tasksChannel) {
      this.supabase.removeChannel(this.tasksChannel);
    }

    this.tasksChannel = this.supabase.channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Cambio detectado en la tabla de tareas (Realtime):', payload);
          this.ngZone.run(async () => {
            await this.checkAndUpdateActsSetupStatus();
            if (this.tasksChangedCallback) {
              this.tasksChangedCallback();
            }
          });
        }
      )
      .subscribe();
  }


  // --- AUTH ---
  async login(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async register(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } }
    });

    // La creación de profiles y scores ahora es manejada automáticamente
    // por el Trigger 'handle_new_user' en Supabase.

    return { data, error };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.userScore.set({ xp: 0, hearts: 5, streak: 0, level: 0 });
    this.userProfile.set(null);
    this.actsSetupComplete.set(false);
    if (this.scoresChannel) {
      this.supabase.removeChannel(this.scoresChannel);
      this.scoresChannel = null;
    }
  }

  // --- DATABASE ---
  async loadUserScore(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('xp, hearts, streak, level')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user score from profiles:', error.message);
      // Fallback
      this.userScore.set({ xp: 0, hearts: 5, streak: 0, level: 0 });
      return;
    }

    if (data) {
      this.userScore.set({
        xp: data.xp ?? 0,
        hearts: data.hearts ?? 5,
        streak: data.streak ?? 0,
        level: data.level ?? 0
      });
    }
  }

  async addXP(amount: number) {
    const user = this.currentUser();
    if (!user) return;

    const currentScore = this.userScore();
    const newXp = currentScore.xp + amount;

    const { error } = await this.supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', user.id);

    if (!error) {
      this.userScore.update(score => ({ ...score, xp: newXp }));
    }
  }

  async loadUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loadUserProfile (Supabase Code:', error.code, '):', error.message);
      // Fallback en caso de error (ej: RLS o fila inexistente)
      this.userProfile.set({
        id: userId,
        couple_id: null,
        couple_code: 'Error (Revisa tu BD)'
      });
      return;
    }

    if (data) {
      this.userProfile.set(data as UserProfile);
      if (data.couple_id) {
        await this.loadPartnerProfile(data.couple_id, userId);
        this.setupPartnerRealtimeSubscription(data.couple_id);
        await this.checkAndUpdateActsSetupStatus();
      } else {
        this.partnerProfile.set(null);
        this.actsSetupComplete.set(false);
        if (this.partnerChannel) {
          this.supabase.removeChannel(this.partnerChannel);
          this.partnerChannel = null;
        }
      }
    } else {
      this.userProfile.set({
        id: userId,
        couple_id: null,
        couple_code: 'No generado'
      });
      this.partnerProfile.set(null);
    }
  }

  async loadPartnerProfile(coupleId: string, myUserId: string) {
    // Si mi couple_id es la ID de mi pareja, busco el perfil cuyo ID sea coupleId
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', coupleId)
      .single();

    if (data && !error) {
      this.partnerProfile.set(data as UserProfile);
    } else {
      this.partnerProfile.set(null);
    }
  }

  async unlinkPartner() {
    const user = this.currentUser();
    if (!user) return { success: false, message: 'No hay usuario autenticado' };

    const profile = this.userProfile();
    if (!profile?.couple_id) return { success: false, message: 'No estás vinculado' };

    const partnerId = profile.couple_id; // El ID de la pareja

    // Llamar al Stored Procedure (RPC) para desvincular de forma segura y borrar todo el progreso
    const { error } = await this.supabase.rpc('desvincular_pareja', {
      p_user_id: user.id,
      p_partner_id: partnerId
    });

    if (error) {
      console.error('Error al ejecutar RPC desvincular_pareja:', error);
      return { success: false, message: 'Error al desvincular cuentas: ' + error.message };
    }

    // Limpiar variables de estado locales (progreso a 0 y desvinculado)
    this.userScore.set({ xp: 0, hearts: 5, streak: 0, level: 0 });
    this.partnerProfile.set(null);
    this.actsSetupComplete.set(false);
    this.actsExecutionComplete.set(false);

    // Recargar perfil local (tendrá couple_id = null)
    await this.loadUserProfile(user.id);

    return { success: true, message: 'Cuentas desvinculadas e historial reseteado con éxito' };
  }

  async linkPartnerByCode(partnerCode: string) {
    const user = this.currentUser();
    if (!user) return { success: false, message: 'No hay usuario autenticado' };

    // 1. Buscar a la pareja por su código
    const { data: partnerData, error: partnerError } = await this.supabase
      .from('profiles')
      .select('id, couple_id')
      .eq('couple_code', partnerCode)
      .single();

    if (partnerError || !partnerData) {
      return { success: false, message: 'Código no encontrado o inválido' };
    }

    if (partnerData.id === user.id) {
      return { success: false, message: 'No puedes usar tu propio código' };
    }

    if (partnerData.couple_id) {
      return { success: false, message: 'Este usuario ya está vinculado con alguien más' };
    }

    const currentProfile = this.userProfile();
    if (currentProfile?.couple_id) {
      return { success: false, message: 'Ya estás vinculado con alguien' };
    }

    // 2. Actualizar nuestro perfil (nuestro couple_id será el ID de la pareja)
    const myUpdateData = { couple_id: partnerData.id };
    console.log('Datos que se intentan enviar (Mi Perfil):', myUpdateData);
    const { error: updateError1 } = await this.supabase
      .from('profiles')
      .update(myUpdateData)
      .eq('id', user.id);

    // 3. Actualizar el perfil de la pareja (su couple_id será nuestro ID)
    const partnerUpdateData = { couple_id: user.id };
    console.log('Datos que se intentan enviar (Perfil Pareja):', partnerUpdateData);
    const { error: updateError2 } = await this.supabase
      .from('profiles')
      .update(partnerUpdateData)
      .eq('id', partnerData.id);

    if (updateError1 || updateError2) {
      const errorObj = updateError1 || updateError2;
      alert('Error de Supabase: ' + JSON.stringify(errorObj, null, 2));
      console.error('Error actualizando mi perfil (Code:', updateError1?.code, '):', updateError1?.message, updateError1?.details);
      console.error('Error actualizando el perfil de la pareja (Code:', updateError2?.code, '):', updateError2?.message, updateError2?.details);
      return { success: false, message: 'Error al vincular cuentas. Revisa la consola (F12) para detalles del código.' };
    }

    // 4. Refrescar el perfil local
    await this.loadUserProfile(user.id);

    return { success: true, message: '¡Cuentas vinculadas con éxito!' };
  }

  // --- ONBOARDING & TRIVIA ---
  async saveOnboardingData(data: {
    favorite_color: string,
    birthday: string,
    childhood_dream: string,
    meeting_place: string,
    gender: string,
    pronoun?: string
  }) {
    const user = this.currentUser();
    if (!user) return { error: new Error('Not authenticated') };

    // Determinar el pronombre preferido según el género seleccionado
    let pronombre = data.pronoun || '';
    if (data.gender === 'Masculino') {
      pronombre = 'Él';
    } else if (data.gender === 'Femenino') {
      pronombre = 'Ella';
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        color_favorito: data.favorite_color,
        cumpleanos: data.birthday,
        sueno_infancia: data.childhood_dream,
        lugar_encuentro: data.meeting_place,
        genero: data.gender,
        pronombre_preferido: pronombre
      })
      .eq('id', user.id);

    if (!error) {
      await this.loadUserProfile(user.id);
    }
    return { error };
  }

  async completeFirstMission() {
    const user = this.currentUser();
    if (!user) return;

    const currentScore = this.userScore();
    const newXp = currentScore.xp + 50; // Recompensa de 50 XP
    const newLevel = Math.max(currentScore.level, 2); // Asegurar que sea al menos nivel 2 (desbloquea Actividad 3)

    const { error } = await this.supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', user.id);

    if (!error) {
      this.userScore.update(score => ({ ...score, xp: newXp, level: newLevel }));
    }
  }



  // --- METODOS DE TAREAS / ACTOS DE SERVICIO ---
  async saveActsOfService(acts: { title: string, is_custom: boolean, assigned_to: string }[]) {
    const user = this.currentUser();
    if (!user) return { error: new Error('Usuario no autenticado') };

    const tasksToInsert = acts.map(act => ({
      user_id: user.id,
      assigned_to: act.assigned_to,
      type: 'act_of_service',
      title: act.title,
      is_custom: act.is_custom,
      status: 'pending',
      rating: 0,
      xp_awarded: 0,
      metadata: {}
    }));

    const { data, error } = await this.supabase
      .from('tasks')
      .insert(tasksToInsert);

    return { data, error };
  }

  async getActsOfService(userId: string) {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('type', 'act_of_service')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  async getTasksAssignedTo(userId: string) {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('type', 'act_of_service')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: true });

    return { data, error };
  }

  async updateTaskStatus(taskId: string, status: string) {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);

    return { data, error };
  }

  async validateAndRateTask(taskId: string, rating: number, doerId: string) {
    const xp = rating * 10; // 1 estrella = 10 XP, ..., 5 estrellas = 50 XP
    const user = this.currentUser();
    if (!user) return { success: false, error: new Error('Usuario no autenticado') };

    // 1. Actualizar la tarea
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        status: 'validated',
        rating: rating,
        xp_awarded: xp
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error al actualizar y calificar tarea:', error);
      return { success: false, error };
    }

    // 2. Otorgar los puntos de XP al realizador
    await this.addXPToUser(doerId, xp);

    // 3. NUEVA LÓGICA DE VALIDACIÓN: Ambos deben haber calificado al otro
    // Obtenemos todas las tareas de tipo 'act_of_service' creadas por o asignadas al usuario actual
    const { data: allTasks, error: tasksError } = await this.supabase
      .from('tasks')
      .select('user_id, assigned_to, status')
      .eq('type', 'act_of_service')
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

    if (!tasksError && allTasks) {
      // Tareas que yo le creé a mi pareja (las que mi pareja hace y yo valido)
      const myCreatedTasks = allTasks.filter(t => t.user_id === user.id);
      // Tareas que mi pareja me creó a mí (las que yo hago y mi pareja valida)
      const partnerCreatedTasks = allTasks.filter(t => t.assigned_to === user.id);

      const myValidatedCount = myCreatedTasks.filter(t => t.status === 'validated').length;
      const partnerValidatedCount = partnerCreatedTasks.filter(t => t.status === 'validated').length;

      const allMyCreatedValidated = myValidatedCount >= 5;
      const allPartnerCreatedValidated = partnerValidatedCount >= 5;

      if (allMyCreatedValidated && allPartnerCreatedValidated) {
        // Ambas parejas han terminado y calificado todo -> Subir de nivel a ambos a 1
        const partner = this.partnerProfile();
        
        // Nivel del usuario actual
        await this.supabase
          .from('profiles')
          .update({ level: 1 })
          .eq('id', user.id);
        
        this.userScore.update(score => ({ ...score, level: 1 }));

        // Nivel de la pareja
        await this.supabase
          .from('profiles')
          .update({ level: 1 })
          .eq('id', doerId);

        console.log(`Nivel de ambos usuarios (${user.id} y ${doerId}) actualizado a 1 por validación mutua completa.`);
      }
    }

    return { success: true };
  }

  async addXPToUser(userId: string, amount: number) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener puntaje para sumar XP:', error);
      return;
    }

    if (data) {
      const newXp = (data.xp || 0) + amount;
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', userId);

      if (updateError) {
        console.error('Error al actualizar puntaje:', updateError);
      } else {
        const me = this.currentUser();
        if (me && me.id === userId) {
          this.userScore.update(score => ({ ...score, xp: newXp }));
        }
      }
    }
  }

  async checkAndUpdateActsSetupStatus(): Promise<boolean> {
    const user = this.currentUser();
    if (!user) {
      this.actsSetupComplete.set(false);
      this.actsExecutionComplete.set(false);
      return false;
    }

    try {
      // 1. Obtener actos de servicio creados por mí
      const { data: myData, error: err1 } = await this.getActsOfService(user.id);
      // 2. Obtener actos de servicio asignados a mí (creados por mi pareja)
      const { data: partnerData, error: err2 } = await this.getTasksAssignedTo(user.id);

      if (err1 || err2) {
        console.error('Error al verificar conteo de actos de servicio:', err1 || err2);
        return false;
      }

      const myCount = myData?.length || 0;
      const partnerCount = partnerData?.length || 0;

      console.log('checkAndUpdateActsSetupStatus counts:', { myCount, partnerCount });

      const complete = myCount >= 5 && partnerCount >= 5;
      this.actsSetupComplete.set(complete);

      // La ejecución de Actividad 1 está completa si AMBOS miembros han calificado los 5 actos de servicio de su pareja (mínimo 5 validados en cada dirección)
      const myTasks = myData || [];
      const partnerTasks = partnerData || [];
      const myValidatedCount = myTasks.filter(t => t.status === 'validated').length;
      const partnerValidatedCount = partnerTasks.filter(t => t.status === 'validated').length;

      const executionComplete = myValidatedCount >= 5 && partnerValidatedCount >= 5;
      
      this.actsExecutionComplete.set(executionComplete);
      console.log('checkAndUpdateActsSetupStatus executionComplete:', executionComplete);

      // Si la ejecución está completa (los 5 actos calificados para ambos) y el nivel es 0, subir a nivel 1
      if (executionComplete) {
        const currentScore = this.userScore();
        if (currentScore && currentScore.level === 0) {
          await this.completeActsSetup();
        }
      }

      return complete;
    } catch (error) {
      console.error('Excepción al verificar estado del setup:', error);
      return false;
    }
  }

  async completeActsSetup() {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActsSetup:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) === 0) {
      const newXp = (myScore.xp || 0) + 50;
      await this.supabase
        .from('profiles')
        .update({ level: 1, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 1, xp: newXp }));
      console.log('Puntos otorgados, nueva XP local:', newXp);
    }

    if (partnerScore && (partnerScore.level || 0) === 0) {
      const partnerNewXp = (partnerScore.xp || 0) + 50;
      await this.supabase
        .from('profiles')
        .update({ level: 1, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }

  async redeemReward(recompensaKey: string, titulo: string, costo: number) {
    const user = this.currentUser();
    if (!user) return { success: false, error: new Error('Usuario no autenticado') };

    const coupleId = this.userProfile()?.couple_id || null;

    // 1. Registrar el canje en Supabase
    const { error: insertErr } = await this.supabase
      .from('recompensas_canjeadas')
      .insert({
        user_id: user.id,
        couple_id: coupleId,
        recompensa_key: recompensaKey,
        titulo: titulo,
        costo: costo
      });

    if (insertErr) {
      console.error('Error al insertar canje:', insertErr);
      return { success: false, error: insertErr };
    }

    // 2. Descontar los puntos de XP al usuario actual (Opción A)
    const currentXP = this.userScore().xp || 0;
    const newXP = Math.max(0, currentXP - costo);

    const { error: updateErr } = await this.supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', user.id);

    if (updateErr) {
      console.error('Error al actualizar XP del usuario:', updateErr);
      return { success: false, error: updateErr };
    }

    // 3. Actualizar la señal local
    this.userScore.update(score => ({ ...score, xp: newXP }));

    return { success: true };
  }

  async loadRedeemedRewards() {
    const user = this.currentUser();
    if (!user) return [];

    const partner = this.partnerProfile();
    const ids = [user.id];
    if (partner) ids.push(partner.id);

    const { data, error } = await this.supabase
      .from('recompensas_canjeadas')
      .select('*')
      .in('user_id', ids)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar recompensas canjeadas:', error);
      return [];
    }

    return data || [];
  }

  async saveMostLikelyAnswers(answers: string[]) {
    const user = this.currentUser();
    if (!user) return { error: new Error('Usuario no autenticado') };

    const coupleId = this.userProfile()?.couple_id || null;

    const { data, error } = await this.supabase
      .from('most_likely_answers')
      .upsert({
        user_id: user.id,
        couple_id: coupleId,
        answers: answers
      }, {
        onConflict: 'user_id,couple_id'
      })
      .select();

    return { data, error };
  }

  async getMostLikelyAnswers(userId: string) {
    const user = this.currentUser();
    const profile = this.userProfile();
    if (!user || !profile) return { data: null, error: new Error('Usuario o perfil no cargados') };

    const partnerId = profile.couple_id || null;
    const expectedCoupleId = (userId === user.id) ? partnerId : user.id;

    const { data, error } = await this.supabase
      .from('most_likely_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('couple_id', expectedCoupleId)
      .maybeSingle();

    return { data, error };
  }

  async completeActivity3(xpAwarded: number) {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActivity3:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) < 3) {
      const newXp = (myScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 3, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 3, xp: newXp }));
    }

    if (partnerScore && (partnerScore.level || 0) < 3) {
      const partnerNewXp = (partnerScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 3, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }

  async getRuletaGame(myId: string, partnerId: string) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;

    const { data, error } = await this.supabase
      .from('ruleta_game')
      .select('*')
      .eq('user_id', sortedUserId)
      .eq('partner_id', sortedPartnerId)
      .maybeSingle();

    return { data, error };
  }

  async initializeRuletaGame(myId: string, partnerId: string) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;

    // Primero verificamos si ya existe
    const { data: existingGame, error: errGet } = await this.getRuletaGame(myId, partnerId);
    if (existingGame) {
      return { data: existingGame, error: errGet };
    }

    // Si no existe, creamos la fila inicial (el turno inicial será del creador, es decir, myId)
    const { data, error } = await this.supabase
      .from('ruleta_game')
      .insert({
        user_id: sortedUserId,
        partner_id: sortedPartnerId,
        turn_id: myId,
        challenge: null,
        status: 'pending',
        user_spins: 0,
        partner_spins: 0
      })
      .select()
      .single();

    return { data, error };
  }

  async updateRuletaSpin(gameId: string, challenge: string) {
    const { data, error } = await this.supabase
      .from('ruleta_game')
      .update({
        challenge: challenge,
        status: 'pending'
      })
      .eq('id', gameId)
      .select()
      .single();

    return { data, error };
  }

  async validateRuletaChallenge(
    gameId: string,
    nextTurnId: string,
    userSpins: number,
    partnerSpins: number,
    isFinished: boolean
  ) {
    const { data, error } = await this.supabase
      .from('ruleta_game')
      .update({
        challenge: null,
        status: isFinished ? 'finished' : 'completed',
        turn_id: nextTurnId,
        user_spins: userSpins,
        partner_spins: partnerSpins
      })
      .eq('id', gameId)
      .select()
      .single();

    return { data, error };
  }

  async completeActivity4(xpAwarded: number) {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActivity4:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) < 4) {
      const newXp = (myScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 4, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 4, xp: newXp }));
    }

    if (partnerScore && (partnerScore.level || 0) < 4) {
      const partnerNewXp = (partnerScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 4, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }

  async getDeseosGame(myId: string, partnerId: string) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;

    const { data, error } = await this.supabase
      .from('deseos_game')
      .select('*')
      .eq('user_id', sortedUserId)
      .eq('partner_id', sortedPartnerId)
      .maybeSingle();

    return { data, error };
  }

  async saveDeseos(myId: string, partnerId: string, deseos: string[]) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;
    const isUser1 = myId < partnerId;

    const { data: existingGame } = await this.getDeseosGame(myId, partnerId);

    const deseosObj = deseos.map(d => ({ texto: d, completado: false }));

    if (existingGame) {
      const updateData = isUser1 
        ? { deseos_user_1: deseosObj } 
        : { deseos_user_2: deseosObj };

      const { data, error } = await this.supabase
        .from('deseos_game')
        .update(updateData)
        .eq('id', existingGame.id)
        .select()
        .single();
      return { data, error };
    } else {
      const emptyDeseos: any[] = [];
      const insertData = isUser1 
        ? {
            user_id: sortedUserId,
            partner_id: sortedPartnerId,
            deseos_user_1: deseosObj,
            deseos_user_2: emptyDeseos,
            status: 'pending'
          }
        : {
            user_id: sortedUserId,
            partner_id: sortedPartnerId,
            deseos_user_1: emptyDeseos,
            deseos_user_2: deseosObj,
            status: 'pending'
          };

      const { data, error } = await this.supabase
        .from('deseos_game')
        .insert(insertData)
        .select()
        .single();
      return { data, error };
    }
  }

  async updateDeseosStatus(gameId: string, deseos1: any[], deseos2: any[], status: string) {
    const { data, error } = await this.supabase
      .from('deseos_game')
      .update({
        deseos_user_1: deseos1,
        deseos_user_2: deseos2,
        status: status
      })
      .eq('id', gameId)
      .select()
      .single();

    return { data, error };
  }

  async completeActivity5(xpAwarded: number) {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActivity5:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) < 5) {
      const newXp = (myScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 5, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 5, xp: newXp }));
    }

    if (partnerScore && (partnerScore.level || 0) < 5) {
      const partnerNewXp = (partnerScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 5, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }

  async completeActivity6(xpAwarded: number) {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActivity6:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) < 6) {
      const newXp = (myScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 6, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 6, xp: newXp }));
    }

    if (partnerScore && (partnerScore.level || 0) < 6) {
      const partnerNewXp = (partnerScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 6, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }

  async getMisionSecretaGame(myId: string, partnerId: string) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;

    const { data, error } = await this.supabase
      .from('mision_secreta_game')
      .select('*')
      .eq('user_id', sortedUserId)
      .eq('partner_id', sortedPartnerId)
      .maybeSingle();

    return { data, error };
  }

  async initializeMisionSecretaGame(myId: string, partnerId: string, misiones1: string[], misiones2: string[]) {
    const sortedUserId = myId < partnerId ? myId : partnerId;
    const sortedPartnerId = myId < partnerId ? partnerId : myId;
    const isUser1 = myId < partnerId;

    const insertData = {
      user_id: sortedUserId,
      partner_id: sortedPartnerId,
      misiones_user_1: isUser1 ? misiones1 : misiones2,
      misiones_user_2: isUser1 ? misiones2 : misiones1,
      sorpresas_validadas_1: 0,
      sorpresas_validadas_2: 0,
      status: 'pending'
    };

    const { data, error } = await this.supabase
      .from('mision_secreta_game')
      .insert(insertData)
      .select()
      .single();

    return { data, error };
  }

  async validateMisionSecreta(gameId: string, val1: number, val2: number, status: string) {
    const { data, error } = await this.supabase
      .from('mision_secreta_game')
      .update({
        sorpresas_validadas_1: val1,
        sorpresas_validadas_2: val2,
        status: status
      })
      .eq('id', gameId)
      .select()
      .single();

    return { data, error };
  }

  async completeActivity7(xpAwarded: number) {
    const user = this.currentUser();
    const partner = this.partnerProfile();
    if (!user || !partner) return { error: new Error('Usuario o pareja no encontrados') };

    const { data: myScore, error: err1 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', user.id)
      .single();

    const { data: partnerScore, error: err2 } = await this.supabase
      .from('profiles')
      .select('level, xp')
      .eq('id', partner.id)
      .single();

    if (err1 || err2) {
      console.error('Error cargando puntajes en completeActivity7:', err1 || err2);
      return { error: err1 || err2 };
    }

    if (myScore && (myScore.level || 0) < 7) {
      const newXp = (myScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 7, xp: newXp })
        .eq('id', user.id);
      
      this.userScore.update(score => ({ ...score, level: 7, xp: newXp }));
    }

    if (partnerScore && (partnerScore.level || 0) < 7) {
      const partnerNewXp = (partnerScore.xp || 0) + xpAwarded;
      await this.supabase
        .from('profiles')
        .update({ level: 7, xp: partnerNewXp })
        .eq('id', partner.id);
    }

    return { success: true };
  }
}

