import { Injectable, signal } from '@angular/core';
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

  constructor() {
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
    } else {
      this.userProfile.set(null);
    }
  }

  private activeChannel: any = null;

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
          this.loadUserProfile(userId); // Recargar datos si detecta cambios desde el otro usuario
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
  }

  // --- DATABASE ---
  async loadUserScore(userId: string) {
    const { data, error } = await this.supabase
      .from('scores')
      .select('xp, hearts, streak, level')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading user score:', error.message);
      // Fallback
      this.userScore.set({ xp: 0, hearts: 5, streak: 0, level: 0 });
      return;
    }

    if (data) {
      this.userScore.set(data as UserScore);
    }
  }

  async addXP(amount: number) {
    const user = this.currentUser();
    if (!user) return;

    const currentScore = this.userScore();
    const newXp = currentScore.xp + amount;

    const { error } = await this.supabase
      .from('scores')
      .update({ xp: newXp })
      .eq('user_id', user.id);

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
      } else {
        this.partnerProfile.set(null);
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

    // Actualizar nuestro perfil a null
    const { error: updateError1 } = await this.supabase
      .from('profiles')
      .update({ couple_id: null })
      .eq('id', user.id);

    // Actualizar el perfil de la pareja a null también
    const { error: updateError2 } = await this.supabase
      .from('profiles')
      .update({ couple_id: null })
      .eq('id', partnerId);

    if (updateError1 || updateError2) {
      return { success: false, message: 'Error al desvincular cuentas' };
    }

    await this.loadUserProfile(user.id);
    return { success: true, message: 'Cuentas desvinculadas' };
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
  async saveOnboardingData(data: { favorite_color: string, birthday: string, childhood_dream: string, meeting_place: string }) {
    const user = this.currentUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await this.supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        color_favorito: data.favorite_color,
        cumpleanos: data.birthday,
        sueno_infancia: data.childhood_dream,
        lugar_encuentro: data.meeting_place
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
    const newLevel = Math.max(currentScore.level, 1); // Asegurar que sea al menos nivel 1

    const { error } = await this.supabase
      .from('scores')
      .update({ xp: newXp, level: newLevel })
      .eq('user_id', user.id);

    if (!error) {
      this.userScore.update(score => ({ ...score, xp: newXp, level: newLevel }));
    }
  }

  async forceResetCoupleId() {
    const user = this.currentUser();
    if (!user) return { success: false, message: 'No hay usuario autenticado' };

    const { error } = await this.supabase
      .from('profiles')
      .update({ couple_id: null })
      .eq('id', user.id);

    if (error) {
      return { success: false, message: 'Error al forzar el reset' };
    }

    await this.loadUserProfile(user.id);
    return { success: true, message: 'Reset completado. couple_id es null.' };
  }
}
