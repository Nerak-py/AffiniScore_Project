import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { environment } from 'src/environments/environment';
import { Subject, from, timer, throwError, defer, of } from 'rxjs';
import { debounceTime, concatMap, retry, catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  titulo: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  sessions = signal<ChatSession[]>([]);
  currentSessionId = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  isLoading = signal<boolean>(false);
  
  private systemPrompt = `Eres 'Afi', un terapeuta de parejas virtual empático y comprensivo.
Fomenta la comunicación constructiva y la empatía en la relación.
Tus respuestas deben ser MUY breves, directas y concisas. Máximo dos párrafos cortos de unas 3 líneas cada uno.
Debes mantener tu rol de apoyo, pero siempre que sea necesario, recuerda de forma sutil que no reemplazas la ayuda profesional de psicólogos, psiquiatras o terapeutas reales.
Si detectas una crisis grave o peligro inminente, detén todo de inmediato y sugerir ayuda oficial (ej. en Chile: 1455, 131, 133, 149).`;

  // Canal de flujo RxJS para procesar los mensajes en cola
  private sendQueue = new Subject<{
    content: string;
    sessionId: string;
    dynamicSystemPrompt: string;
    apiContents: any;
  }>();

  constructor(private supabaseService: SupabaseService) {
    this.initializeSendQueue();
  }

  // Inicializar la tubería reactiva con Debouncing, Throttling y ConcatMap
  private initializeSendQueue() {
    this.sendQueue.pipe(
      // Debounce: Si el usuario pulsa enviar varias veces rápido, reduce la frecuencia de la ráfaga
      debounceTime(300),
      // concatMap: Asegura el orden secuencial de los mensajes en cola
      concatMap(({ content, sessionId, dynamicSystemPrompt, apiContents }) => {
        const requestBody = {
          contents: apiContents,
          systemInstruction: {
            parts: [{ text: dynamicSystemPrompt }]
          }
        };

        return this.makeApiCallObservable(requestBody).pipe(
          map(result => ({ result, sessionId })),
          // Capturar error al final de los intentos para no romper la suscripción
          catchError(err => {
            console.error('Error final en la tubería de Gemini tras reintentos. Detalle completo:', JSON.stringify(err.rawError || err, null, 2));
            return of({ error: err, sessionId });
          })
        );
      })
    ).subscribe(async (response: any) => {
      this.isLoading.set(false);

      if (response.error) {
        let errorMsg = 'Hubo un error conectando con el servidor. Revisa la consola para detalles.';
        if (response.error.status === 429) {
          errorMsg = `Límite de cuota excedido (Error 429). Detalles: ${response.error.message || 'Sin mensaje de detalle'}. Por favor, espera un momento antes de volver a preguntar a Afi.`;
        }
        this.messages.update(m => [...m, { role: 'model', content: errorMsg }]);
        return;
      }

      // Procesar respuesta exitosa
      let aiResponseText = '';
      const result = response.result;
      if (result.candidates && result.candidates[0]?.content?.parts?.length > 0) {
        aiResponseText = result.candidates[0].content.parts[0].text;
      } else {
        aiResponseText = 'Formato de respuesta desconocido.';
      }

      // Guardar localmente
      const aiMsg: ChatMessage = { role: 'model', content: aiResponseText };
      this.messages.update(m => [...m, aiMsg]);
      
      // Guardar en la base de datos
      await this.supabaseService.client.from('chat_messages').insert({
        session_id: response.sessionId,
        role: 'model',
        content: aiResponseText
      });
    });
  }

  // Encapsulación de la llamada HTTP en un Observable diferido con reintento exponencial (Backoff)
  private makeApiCallObservable(requestBody: any) {
    // Actualizado a gemini-3.5-flash (gemini-1.5-flash fue descontinuado y devuelve 404)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${environment.geminiApiKey}`;

    return defer(() => from(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }).then(async response => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          // Log detallado e inmediato de la respuesta de error de Gemini
          console.error(`[Gemini API HTTP Error ${response.status}]:`, JSON.stringify(errData, null, 2));
          throw { 
            status: response.status, 
            message: errData.error?.message || response.statusText,
            rawError: errData
          };
        }
        return response.json();
      })
    )).pipe(
      // Reintento Inteligente: Reintenta exponencialmente solo si el error es 429 (Too Many Requests)
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error.status === 429) {
            const backoffTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.warn(`Error 429 recibido de Gemini. Reintentando en ${backoffTime}ms... (Intento ${retryCount})`);
            return timer(backoffTime);
          }
          // Si es otro tipo de error (ej: 404, 400), lanzar error inmediatamente
          return throwError(() => error);
        }
      })
    );
  }

  // Cargar sesiones de chat del usuario
  async loadSessions() {
    const user = this.supabaseService.currentUser();
    if (!user) return;

    const { data, error } = await this.supabaseService.client
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.sessions.set(data as ChatSession[]);
    }
  }

  // Cargar mensajes de una sesión seleccionada
  async loadSessionMessages(sessionId: string) {
    this.isLoading.set(true);
    this.currentSessionId.set(sessionId);

    const { data, error } = await this.supabaseService.client
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      this.messages.set(data as ChatMessage[]);
    } else {
      console.error('Error al cargar mensajes de la sesión:', error);
      this.messages.set([]);
    }
    this.isLoading.set(false);
  }

  // Inicializar un nuevo chat limpio localmente
  startNewChat() {
    this.currentSessionId.set(null);
    const profile = this.supabaseService.userProfile();
    const userName = profile?.full_name?.split(' ')[0] || 'pareja';
    const welcomeText = `¡Hola ${userName}! Dime, ¿en qué puedo ayudarte hoy?`;
    
    this.messages.set([{ role: 'model', content: welcomeText }]);
  }

  // Cargar el estado inicial del chat
  async initializeChat() {
    await this.loadSessions();
    
    const activeSessions = this.sessions();
    if (activeSessions.length > 0) {
      await this.loadSessionMessages(activeSessions[0].id);
    } else {
      this.startNewChat();
    }
  }

  // Método público para enviar mensajes
  async sendMessage(content: string) {
    if (!content.trim() || this.isLoading()) return;

    const user = this.supabaseService.currentUser();
    if (!user) return;

    // 1. Mostrar mensaje del usuario localmente e indicar carga de forma inmediata
    const userMsg: ChatMessage = { role: 'user', content };
    this.messages.update(m => [...m, userMsg]);
    this.isLoading.set(true);

    try {
      // 2. Si no hay sesión activa, crearla de forma diferida (Lazy Session Creation)
      let sessionId = this.currentSessionId();
      
      if (!sessionId) {
        const title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        const { data: newSession, error: sessionErr } = await this.supabaseService.client
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            titulo: title
          })
          .select()
          .single();

        if (sessionErr || !newSession) {
          throw new Error('No se pudo crear la sesión de chat: ' + sessionErr?.message);
        }

        sessionId = newSession.id;
        this.currentSessionId.set(sessionId);

        // Guardar el saludo de bienvenida primero si existe
        const welcomeMsg = this.messages().find(m => m.role === 'model');
        if (welcomeMsg) {
          await this.supabaseService.client.from('chat_messages').insert({
            session_id: sessionId,
            role: 'model',
            content: welcomeMsg.content
          });
        }

        await this.loadSessions();
      }

      // 3. Guardar el mensaje del usuario en la base de datos
      await this.supabaseService.client.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content
      });

      // 4. Obtener el perfil para inyectar contexto dinámico en el Prompt del sistema
      const profile = this.supabaseService.userProfile();
      let dynamicSystemPrompt = this.systemPrompt;
      if (profile) {
        const name = profile.full_name || 'Usuario';
        const gender = profile.genero || 'No especificado';
        const pronoun = profile.pronombre_preferido || 'No especificado';
        const favColor = profile.color_favorito || 'No especificado';
        const meetingPlace = profile.lugar_encuentro || 'No especificado';
        
        dynamicSystemPrompt += `\n\n[CONTEXTO DEL USUARIO ACTUAL]:
- Nombre: ${name}
- Género: ${gender}
- Pronombre preferido: ${pronoun}
- Color favorito: ${favColor}
- Lugar donde conoció a su pareja: ${meetingPlace}
Debes dirigirte al usuario utilizando su nombre y pronombre preferido, adaptando las conjugaciones (ej. si usa 'elle', prefiere adjetivos neutros como 'contento/a' -> 'contente').`;
      }

      // 5. Filtrar el historial local asegurando que comience con un turno de 'user'
      const messagesArray = this.messages();
      const firstUserIndex = messagesArray.findIndex(m => m.role === 'user');
      const chatHistory = firstUserIndex !== -1 ? messagesArray.slice(firstUserIndex) : [];

      const apiContents = chatHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      // 6. Introducir la petición en la cola RxJS
      this.sendQueue.next({
        content,
        sessionId: sessionId!,
        dynamicSystemPrompt,
        apiContents
      });

    } catch (error) {
      console.error('Error al iniciar flujo de envío:', error);
      this.isLoading.set(false);
      this.messages.update(m => [...m, { 
        role: 'model', 
        content: 'Hubo un error de conexión al inicializar tu mensaje.' 
      }]);
    }
  }
}
