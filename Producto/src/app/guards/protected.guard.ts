import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const protectedGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Esperamos la sesión
  const { data: { session } } = await supabaseService['supabase'].auth.getSession();
  
  if (!session?.user) {
    router.navigate(['/login']);
    return false;
  }

  // Cargar perfil si no está cargado
  let profile = supabaseService.userProfile();
  if (!profile) {
    await supabaseService.loadUserProfile(session.user.id);
    profile = supabaseService.userProfile();
  }

  // Verificar onboarding completado
  if (profile && profile.onboarding_completed === false) {
    // Solo redirigir si no estamos ya yendo a onboarding
    // Aunque protectedGuard se aplica a tabs, es buena práctica validarlo.
    router.navigate(['/onboarding']);
    return false;
  }

  return true;
};
