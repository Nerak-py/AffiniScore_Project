import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { protectedGuard } from './guards/protected.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [authGuard]
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [protectedGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
    canActivate: [authGuard]
  },
  {
    path: 'trivia',
    loadComponent: () => import('./pages/trivia/trivia.page').then( m => m.TriviaPage)
  },
  {
    path: 'acts-setup',
    loadComponent: () => import('./pages/acts-setup/acts-setup.page').then( m => m.ActsSetupPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: 'therapist-chat',
    loadComponent: () => import('./pages/therapist-chat/therapist-chat.page').then( m => m.TherapistChatPage)
  },
  {
    path: 'most-likely',
    loadComponent: () => import('./pages/most-likely/most-likely.page').then(m => m.MostLikelyPage)
  },
  {
    path: 'ruleta',
    loadComponent: () => import('./pages/ruleta/ruleta.page').then(m => m.RuletaPage)
  },
  {
    path: 'buzon-romantico',
    loadComponent: () => import('./pages/buzon-romantico/buzon-romantico.page').then(m => m.BuzonRomanticoPage)
  },
  {
    path: 'actividad7',
    loadComponent: () => import('./pages/actividad7/actividad7.page').then(m => m.Actividad7Page)
  },
  {
    path: 'intro-cutscene',
    loadComponent: () => import('./components/intro-cutscene/intro-cutscene.component').then(m => m.IntroCutsceneComponent)
  },
  {
    path: 'couple-link',
    redirectTo: 'tabs/profile',
    pathMatch: 'full'
  }
];
