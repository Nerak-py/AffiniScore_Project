import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from 'src/environments/environment';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  messages = signal<ChatMessage[]>([]);
  isLoading = signal<boolean>(false);
  
  private systemPrompt = `[INSTRUCCIONES DEL SISTEMA: Eres 'Afi', un terapeuta de parejas empático. Fomenta la comunicación y sé neutral. Si hay crisis o peligro inminente, detén todo y sugiere ayuda (en Chile: 1455, 131, 133, 149).]`;

  constructor(private supabaseService: SupabaseService) {}

  async loadHistory() {
    const user = this.supabaseService.currentUser();
    if (!user) return;
    
    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      this.messages.set(data as ChatMessage[]);
    }
    this.isLoading.set(false);
  }

  async sendMessage(content: string) {
    const user = this.supabaseService.currentUser();
    if (!user) return;

    // 1. Mostrar localmente
    const userMsg: ChatMessage = { role: 'user', content };
    this.messages.update(m => [...m, userMsg]);
    this.isLoading.set(true);

    this.supabaseService.client.from('chat_history').insert({
      user_id: user.id,
      role: 'user',
      content
    }).then();

    try {
      // 2. Unificar texto (Sistema + Mensaje)
      const promptText = `${this.systemPrompt}\n\nEl usuario dice: ${content}`;

      // 3. Payload Estricto
      const requestBody = {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      };

      // URL Maestra actualizada al modelo moderno
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${environment.geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      console.log('Respuesta completa de Gemini:', result);

      if (!response.ok) {
        throw new Error(`Error de red o permisos: Status ${response.status}`);
      }

      // 5. Extraer texto según estructura
      let aiResponseText = '';
      if (result.candidates && result.candidates[0]?.content?.parts?.length > 0) {
        aiResponseText = result.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Formato de respuesta desconocido.');
      }

      // 6. Guardar y mostrar
      const aiMsg: ChatMessage = { role: 'model', content: aiResponseText };
      this.messages.update(m => [...m, aiMsg]);
      
      this.supabaseService.client.from('chat_history').insert({
        user_id: user.id,
        role: 'model',
        content: aiResponseText
      }).then();

    } catch (error) {
      console.error('Error enviando mensaje a Gemini:', error);
      this.messages.update(m => [...m, { 
        role: 'model', 
        content: 'Hubo un error conectando con el servidor. Revisa la consola para detalles.' 
      }]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
