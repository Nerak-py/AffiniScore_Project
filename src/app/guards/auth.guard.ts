import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Esperar un momento si el usuario aún se está cargando, o forzar la verificación.
  const { data: { session } } = await supabaseService['supabase'].auth.getSession();
  
  if (session?.user) {
    // Si ya está logueado, lo mandamos al path en lugar de mostrar login/register
    router.navigate(['/tabs/path']);
    return false;
  }
  
  // Si no está logueado, le permitimos acceder a login/register
  return true;
};
