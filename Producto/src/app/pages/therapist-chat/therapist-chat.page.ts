import { Component, OnInit, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
import { ChatService } from '../../services/chat.service';
import { addIcons } from 'ionicons';
import { heart, send, chatbubbles } from 'ionicons/icons';

@Component({
  selector: 'app-therapist-chat',
  templateUrl: './therapist-chat.page.html',
  styleUrls: ['./therapist-chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TherapistChatPage implements OnInit, AfterViewChecked {
  @ViewChild('content', { static: false }) content!: IonContent;
  
  newMessage: string = '';
  
  constructor(public chatService: ChatService) {
    // Registrar iconos en el constructor para evitar errores en la consola
    addIcons({ heart, send, chatbubbles });
    
    // Auto-scroll reactivo
    effect(() => {
      const msgs = this.chatService.messages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    this.chatService.loadHistory();
  }

  ngAfterViewChecked() {}

  scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(300);
    }
  }

  async sendMessage() {
    if (this.newMessage.trim() === '') return;
    
    const message = this.newMessage;
    this.newMessage = '';
    
    // Esperar la respuesta de forma asíncrona
    await this.chatService.sendMessage(message);
    this.scrollToBottom();
  }
}
