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
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: 'therapist-chat',
    loadComponent: () => import('./pages/therapist-chat/therapist-chat.page').then( m => m.TherapistChatPage)
  }
];
