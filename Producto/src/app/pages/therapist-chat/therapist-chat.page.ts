import { Component, OnInit, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule, MenuController } from '@ionic/angular';
import { ChatService } from '../../services/chat.service';
import { addIcons } from 'ionicons';
import { heart, send, chatbubbles, add, chatbubblesOutline, menu } from 'ionicons/icons';

@Component({
  selector: 'app-therapist-chat',
  templateUrl: './therapist-chat.page.html',
  styleUrls: ['./therapist-chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TherapistChatPage implements OnInit {
  @ViewChild('content', { static: false }) content!: IonContent;
  
  private menuCtrl = inject(MenuController);
  newMessage: string = '';
  
  constructor(public chatService: ChatService) {
    // Registrar iconos en el constructor para evitar advertencias de consola
    addIcons({ heart, send, chatbubbles, add, chatbubblesOutline, menu });
    
    // Auto-scroll reactivo al recibir o cargar mensajes
    effect(() => {
      const msgs = this.chatService.messages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit() {
    this.chatService.initializeChat();
  }

  scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(300);
    }
  }

  async sendMessage() {
    if (this.newMessage.trim() === '') return;
    
    const message = this.newMessage;
    this.newMessage = '';
    
    // Enviar asíncronamente
    await this.chatService.sendMessage(message);
    this.scrollToBottom();
  }

  async selectSession(sessionId: string) {
    await this.chatService.loadSessionMessages(sessionId);
    this.menuCtrl.close('chat-menu');
  }

  newChat() {
    this.chatService.startNewChat();
    this.menuCtrl.close('chat-menu');
  }
}
