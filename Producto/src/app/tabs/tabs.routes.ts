import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'path',
        loadComponent: () => import('../pages/path/path.page').then(m => m.PathPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('../pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'chat',
        loadComponent: () => import('../pages/therapist-chat/therapist-chat.page').then(m => m.TherapistChatPage)
      },
      {
        path: '',
        redirectTo: 'path',
        pathMatch: 'full',
      },
    ],
  }
];
