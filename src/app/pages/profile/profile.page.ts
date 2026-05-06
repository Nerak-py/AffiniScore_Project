import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, heart } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  partnerCode = '';
  isLinking = signal<boolean>(false);
  linkMessage = signal<string>('');
  linkSuccess = signal<boolean>(false);

  constructor(
    public supabase: SupabaseService,
    private router: Router
  ) {
    addIcons({ arrowBackOutline, logOutOutline, heart });
  }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['/tabs/path']);
  }

  async linkPartner() {
    if (!this.partnerCode || this.partnerCode.trim() === '') return;
    
    this.isLinking.set(true);
    this.linkMessage.set('');
    
    const result = await this.supabase.linkPartnerByCode(this.partnerCode.trim().toUpperCase());
    
    this.linkSuccess.set(result.success);
    this.linkMessage.set(result.message);
    this.isLinking.set(false);
  }

  async logout() {
    await this.supabase.logout();
    this.router.navigate(['/login']);
  }
}
