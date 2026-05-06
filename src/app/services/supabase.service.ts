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
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Estado Reactivo con Signals
  currentUser = signal<User | null>(null);
  userScore = signal<UserScore>({ xp: 0, hearts: 5, streak: 0, level: 1 });
  userProfile = signal<UserProfile | null>(null);

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
    } else {
      this.userProfile.set(null);
    }
  }

  // --- AUTH ---
  async login(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async register(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } }
    });

    if (data.user) {
      // Inicializar score por defecto
      await this.supabase.from('scores').insert({ user_id: data.user.id });

      // Generar y crear perfil
      const randomCode = 'AF-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      await this.supabase.from('profiles').insert({
        id: data.user.id,
        couple_code: randomCode
      });
    }
    return { data, error };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.userScore.set({ xp: 0, hearts: 5, streak: 0, level: 1 });
    this.userProfile.set(null);
  }

  // --- DATABASE ---
  async loadUserScore(userId: string) {
    const { data, error } = await this.supabase
      .from('scores')
      .select('xp, hearts, streak, level')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
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

    if (data && !error) {
      this.userProfile.set(data as UserProfile);
    }
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

    // 2. Crear un nuevo couple_id (UUID v4)
    const newCoupleId = crypto.randomUUID();

    // 3. Actualizar ambos perfiles
    const { error: updateError1 } = await this.supabase
      .from('profiles')
      .update({ couple_id: newCoupleId })
      .eq('id', user.id);

    const { error: updateError2 } = await this.supabase
      .from('profiles')
      .update({ couple_id: newCoupleId })
      .eq('id', partnerData.id);

    if (updateError1 || updateError2) {
      return { success: false, message: 'Error al vincular cuentas' };
    }

    // 4. Refrescar el perfil local
    await this.loadUserProfile(user.id);

    return { success: true, message: '¡Cuentas vinculadas con éxito!' };
  }
}
