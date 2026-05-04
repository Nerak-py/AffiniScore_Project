/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Heart, 
  Trophy, 
  Camera, 
  MessageSquare, 
  Gift, 
  MapPin, 
  Flame, 
  ChevronRight,
  Star,
  Send,
  Sparkles,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Volume2,
  UserMinus,
  Bell,
  Globe,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, ReactNode } from 'react';

type ActivityType = 'trivia' | 'photo' | 'gesture' | 'locked' | 'meta';

interface ActivityNode {
  id: number;
  title: string;
  type: ActivityType;
  points: number;
  status: 'completed' | 'current' | 'locked';
  x: number; // Percent of width
  y: number; // Scroll position relative
}

const NODES: ActivityNode[] = [
  { id: 1, title: 'Nuestra Historia', type: 'trivia', points: 50, status: 'completed', x: 30, y: 100 },
  { id: 2, title: '¿Dónde fue esto?', type: 'photo', points: 75, status: 'completed', x: 70, y: 250 },
  { id: 3, title: 'Gesto de Ternura', type: 'gesture', points: 30, status: 'current', x: 40, y: 400 },
  { id: 4, title: 'Trivia Picante', type: 'trivia', points: 100, status: 'locked', x: 75, y: 550 },
  { id: 5, title: 'Adivina el Lugar', type: 'photo', points: 80, status: 'locked', x: 35, y: 700 },
  { id: 6, title: 'Abrazo de 30s', type: 'gesture', points: 40, status: 'locked', x: 65, y: 850 },
  { id: 7, title: '¡Meta Semanal!', type: 'meta', points: 500, status: 'locked', x: 50, y: 1000 },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'animating'>('login');
  const [activeTab, setActiveTab] = useState<'path' | 'rewards' | 'profile' | 'therapist' | 'settings'>('path');
  
  const [xp, setXp] = useState(560);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(12);
  const [showRewards, setShowRewards] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ActivityNode | null>(null);
  
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: '¡Hola! Soy tu Terapeuta Virtual. ¿En qué puedo ayudarles hoy a fortalecer su relación?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'therapist') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg = { role: 'user' as const, text: inputMessage };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Entiendo. Es importante comunicar eso desde el amor. ¿Has intentado hablarlo con calma?' 
      }]);
    }, 1000);
  };

  // Generate SVG path string from nodes
  const pathD = NODES.reduce((acc, node, i) => {
    if (i === 0) return `M ${node.x}% ${node.y}`;
    // Use quadratic curves for smooth "Duolingo" feel
    const prev = NODES[i - 1];
    const cpX = i % 2 === 0 ? 10 : 90; // Control points alternating for curves
    return `${acc} Q ${cpX}% ${(prev.y + node.y) / 2} ${node.x}% ${node.y}`;
  }, '');

  // Logo Animation Control
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('animating');
    setTimeout(() => {
      setIsLoggedIn(true);
    }, 2500);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-[#FFF5F5] flex flex-col shadow-2xl relative overflow-hidden font-sans">
        <AnimatePresence mode="wait">
          {authStep === 'animating' ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-6"
              >
                <Logo size={120} />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-black text-brand-pink italic"
              >
                AffiniScore
              </motion.h2>
              <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest">Creciendo Juntos...</p>
            </motion.div>
          ) : (
            <motion.div 
              key={authStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col p-8 pt-16"
            >
              <div className="flex justify-center mb-10">
                <Logo size={80} />
              </div>

              <h1 className="text-3xl font-black text-brand-dark mb-2">
                {authStep === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h1>
              <p className="text-gray-400 text-sm mb-8">
                {authStep === 'login' ? 'Tu relación te ha estado extrañando.' : 'Empieza el camino hacia una relación más fuerte.'}
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                {authStep === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-pink ml-2">Nombre Completo</label>
                    <input type="text" required placeholder="Tu nombre" className="w-full bg-white border border-pink-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-brand-pink/20 transition-all shadow-sm" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-pink ml-2">Email o Usuario</label>
                  <input type="text" required placeholder="usuario@amor.com" className="w-full bg-white border border-pink-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-brand-pink/20 transition-all shadow-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-pink ml-2">Contraseña</label>
                  <input type="password" required placeholder="••••••••" className="w-full bg-white border border-pink-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-brand-pink/20 transition-all shadow-sm" />
                </div>
                
                {authStep === 'login' && (
                  <div className="text-right">
                    <button type="button" className="text-xs font-bold text-brand-pink hover:underline">¿Olvidaste tu contraseña?</button>
                  </div>
                )}

                <button type="submit" className="w-full bg-brand-pink text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 active:scale-[0.98] transition-transform mt-4">
                  {authStep === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                </button>
              </form>

              <div className="mt-8 flex flex-col gap-3">
                <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">O continúa con</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white border border-pink-50 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:bg-pink-50 transition-colors">
                    <Globe size={16} className="text-blue-500" /> Google
                  </button>
                  <button className="bg-white border border-pink-50 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:bg-pink-50 transition-colors">
                    <MessageSquare size={16} className="text-green-500" /> QR Code
                  </button>
                </div>
              </div>

              <div className="mt-auto text-center pb-4">
                <button 
                  onClick={() => setAuthStep(authStep === 'login' ? 'register' : 'login')}
                  className="text-xs font-bold text-gray-400"
                >
                  {authStep === 'login' ? '¿No tienes cuenta? ' : '¿Ya eres usuario? '}
                  <span className="text-brand-pink">Haz clic aquí</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-[#FFF5F5] overflow-hidden flex flex-col shadow-2xl border-x border-gray-100">
      
      {/* Header Stats Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 p-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Couple Avatar Sim */}
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full border-2 border-brand-pink bg-pink-100 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-brand-pink">EL</span>
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-brand-pink bg-white flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-brand-pink">ELLA</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={18} fill="currentColor" />
              <span>{streak}</span>
            </div>
            <div className="flex items-center gap-1 text-brand-coral">
              <Heart size={18} fill="currentColor" />
              <span>{hearts}</span>
            </div>
            <div className="flex items-center gap-1 text-brand-pink">
              <Star size={18} fill="currentColor" />
              <span>{xp} XP</span>
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-3 h-2 bg-pink-50 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '65%' }}
            className="h-full bg-gradient-to-r from-brand-pink to-brand-coral"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'path' ? (
          <motion.main 
            key="path"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            ref={containerRef}
            className="flex-1 overflow-y-auto mt-24 pb-32 px-4 scrollbar-hide relative"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="relative" style={{ height: '1200px' }}>
              {/* Draw Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="#F9A8B1" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="interactive-path"
                />
              </svg>

              {/* Render Nodes */}
              {NODES.map((node) => (
                <div 
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${node.x}%`, top: `${node.y}px` }}
                >
                  <ActivityButton 
                    node={node} 
                    onClick={() => setSelectedNode(node)} 
                  />
                  <div className="mt-2 text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      node.status === 'locked' ? 'text-gray-400 bg-gray-100' : 'text-brand-pink bg-white shadow-sm'
                    }`}>
                      {node.id}. {node.title}
                    </span>
                  </div>
                </div>
              ))}

              {/* Mascot Bubble */}
              <motion.div 
                className="absolute left-6 top-8 bg-white p-3 rounded-2xl shadow-lg border border-pink-100 max-w-[120px]"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <div className="text-[10px] font-medium leading-tight text-gray-500 mb-2">¡Sigue creciendo nuestro amor!</div>
                <div className="w-12 h-12 bg-brand-pink rounded-full flex items-center justify-center">
                  <Heart fill="white" color="white" />
                </div>
              </motion.div>
            </div>
          </motion.main>
        ) : activeTab === 'profile' ? (
          <motion.main 
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto mt-24 pb-32 px-6 scrollbar-hide"
          >
            {/* User Profile Info */}
            <section className="mt-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-brand-pink shadow-xl flex items-center justify-center overflow-hidden">
                  <span className="text-2xl font-bold text-white">EL</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg">
                  <Trophy size={16} />
                </div>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-brand-dark">Kare Santibañez</h2>
              <p className="text-sm text-gray-500 font-medium italic">Nivel 12 • Amante Experto</p>
              
              <div className="mt-4 w-full bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex justify-around">
                <div className="text-center">
                  <div className="text-brand-pink font-bold text-lg">560</div>
                  <div className="text-[10px] uppercase tracking-tighter text-gray-400">Total XP</div>
                </div>
                <div className="w-px bg-pink-100" />
                <div className="text-center">
                  <div className="text-brand-coral font-bold text-lg">15</div>
                  <div className="text-[10px] uppercase tracking-tighter text-gray-400">Juegos</div>
                </div>
                <div className="w-px bg-pink-100" />
                <div className="text-center">
                  <div className="text-orange-500 font-bold text-lg">12</div>
                  <div className="text-[10px] uppercase tracking-tighter text-gray-400">Racha</div>
                </div>
              </div>
            </section>

            {/* History Section */}
            <section className="mt-8">
              <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                <Star className="text-yellow-500" size={20} fill="#EAB308" />
                Historial de Actividades
              </h3>
              <div className="space-y-3">
                {[
                  { title: "Nuestra Historia", points: "+50 XP", date: "Hace 2 horas", type: "trivia" },
                  { title: "¿Dónde fue esto?", points: "+75 XP", date: "Ayer", type: "photo" },
                  { title: "Abrazo Sorpresa", points: "+30 XP", date: "Lunes", type: "gesture" },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-pink-50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getNodeColor(item.type as any)} text-white`}>
                        {getNodeIcon(item.type as any, 'completed')}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{item.title}</div>
                        <div className="text-[10px] text-gray-400">{item.date}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-brand-pink">{item.points}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Media Upload Section */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                  <Camera className="text-brand-coral" size={20} />
                  Momentos Guardados
                </h3>
                <button className="text-xs font-bold text-brand-pink underline">Ver todos</button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="aspect-square bg-white border-2 border-dashed border-pink-200 rounded-2xl flex flex-col items-center justify-center text-pink-300 hover:bg-pink-50 transition-colors cursor-pointer">
                  <Camera size={32} />
                  <span className="text-[10px] mt-1 font-bold">Añadir Foto</span>
                </div>
                <div className="aspect-square bg-gray-200 rounded-2xl overflow-hidden group relative shadow-md">
                   <img src="https://images.unsplash.com/photo-1516589174184-c68526614488?w=300&h=300&fit=crop" alt="Memory" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
              </div>
            </section>
          </motion.main>
        ) : activeTab === 'rewards' ? (
          <motion.main 
            key="rewards"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 overflow-y-auto mt-24 pb-32 px-6 scrollbar-hide"
          >
            <div className="py-6">
              <h2 className="text-2xl font-bold text-brand-dark mb-6">Tienda de Intercambio</h2>
              <div className="grid grid-cols-2 gap-4">
                <RewardCard title="Cena Romántica" cost={500} icon={<Heart fill="white" />} />
                <RewardCard title="Sesión de Masajes" cost={300} icon={<Flame fill="white" />} />
                <RewardCard title="Vale por un Postre" cost={150} icon={<Star fill="white" />} />
                <RewardCard title="Noche de Pelis" cost={200} icon={<Camera fill="white" />} />
                <RewardCard title="Día de Spa" cost={1000} icon={<Trophy fill="white" />} />
                <RewardCard title="Beso Infinito" cost={50} icon={<Sparkles fill="white" />} />
              </div>
            </div>
          </motion.main>
        ) : activeTab === 'therapist' ? (
          <motion.main 
            key="therapist"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col mt-24 pb-32 px-4 scrollbar-hide overflow-hidden"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-pink-50 flex-1 flex flex-col overflow-hidden max-h-[calc(100vh-280px)]">
              {/* Therapist Header */}
              <div className="p-4 bg-brand-pink text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Terapeuta de Relaciones</h3>
                  <p className="text-[10px] opacity-80">AI • Siempre disponible para escucharlos</p>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[80%] px-4 py-3 rounded-2xl text-sm
                      ${msg.role === 'user' 
                        ? 'bg-brand-pink text-white rounded-tr-none shadow-sm' 
                        : 'bg-brand-soft text-brand-dark rounded-tl-none border border-pink-50'}
                    `}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-pink-50 bg-white">
                <div className="flex items-center gap-2 bg-brand-soft rounded-2xl px-4 py-2 border border-pink-100">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe algo aquí..."
                    className="flex-1 bg-transparent py-2 outline-none text-sm text-brand-dark placeholder:text-pink-200"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="p-2 bg-brand-coral text-white rounded-xl shadow-lg hover:bg-brand-pink transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.main>
        ) : (
          <motion.main 
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto mt-24 pb-32 px-6 scrollbar-hide"
          >
            <div className="py-6 space-y-8">
              <h2 className="text-2xl font-bold text-brand-dark">Ajustes</h2>
              
              {/* Profile Settings */}
              <section>
                <h3 className="text-xs font-black uppercase text-pink-300 tracking-widest mb-4">Perfil</h3>
                <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-pink-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-400 rounded-lg"><User size={20} /></div>
                      <span className="font-semibold text-sm">Editar Perfil</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                  <div className="h-px bg-pink-50 mx-4" />
                  <button className="w-full p-4 flex items-center justify-between hover:bg-pink-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 text-brand-pink rounded-lg"><Bell size={20} /></div>
                      <span className="font-semibold text-sm">Notificaciones</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                </div>
              </section>

              {/* App Preferences */}
              <section>
                <h3 className="text-xs font-black uppercase text-pink-300 tracking-widest mb-4">Preferencias</h3>
                <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-400 rounded-lg"><Volume2 size={20} /></div>
                      <span className="font-semibold text-sm">Música y Sonido</span>
                    </div>
                    <div className="w-10 h-5 bg-brand-pink rounded-full relative flex items-center px-1">
                      <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="h-px bg-pink-50 mx-4" />
                  <button className="w-full p-4 flex items-center justify-between hover:bg-pink-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 text-green-400 rounded-lg"><Globe size={20} /></div>
                      <span className="font-semibold text-sm">Idioma</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-400">Español</span>
                       <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  </button>
                </div>
              </section>

              {/* Danger Zone */}
              <section>
                <h3 className="text-xs font-black uppercase text-red-300 tracking-widest mb-4">Zona de Peligro</h3>
                <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-400 rounded-lg group-hover:bg-red-100"><UserMinus size={20} /></div>
                      <span className="font-semibold text-sm text-red-500">Desvinculación de Pareja</span>
                    </div>
                    <ChevronRight size={18} className="text-red-200" />
                  </button>
                </div>
              </section>

              {/* Logout Button */}
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setAuthStep('login');
                }}
                className="w-full py-4 bg-white border border-pink-100 rounded-2xl flex items-center justify-center gap-2 text-brand-coral font-bold shadow-sm active:scale-[0.98] transition-transform"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
              
              <div className="text-center pb-8">
                <p className="text-[10px] font-bold text-pink-200 uppercase tracking-tighter">AffiniScore v1.0.4 • 2026</p>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 px-6 py-4 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('path')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'path' ? 'text-brand-pink' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'path' ? 'bg-pink-50' : ''}`}>
              <MapPin size={22} fill={activeTab === 'path' ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-bold uppercase">Camino</span>
          </button>
          
          <button 
            onClick={() => setShowRewards(true)}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <div className="p-2">
              <Gift size={22} />
            </div>
            <span className="text-[10px] font-bold uppercase">Premios</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-brand-pink' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'profile' ? 'bg-pink-50' : ''}`}>
              <User size={22} fill={activeTab === 'profile' ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-bold uppercase">Pareja</span>
          </button>

          <button 
            onClick={() => setActiveTab('therapist')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'therapist' ? 'text-brand-pink' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'therapist' ? 'bg-pink-50' : ''}`}>
              <Heart size={22} fill={activeTab === 'therapist' ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-bold uppercase">Terapia</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-brand-pink' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTab === 'settings' ? 'bg-pink-50' : ''}`}>
              <Settings size={22} fill={activeTab === 'settings' ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-bold uppercase">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Activity Details Sheet */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedNode(null)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-[32px] p-8 pb-12 shadow-2xl relative"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-2xl ${getNodeColor(selectedNode.type)} text-white`}>
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-dark">{selectedNode.title}</h3>
                  <p className="text-sm text-gray-500">Gana hasta {selectedNode.points} XP</p>
                </div>
              </div>

              <div className="bg-brand-soft p-4 rounded-2xl mb-8">
                <p className="text-sm leading-relaxed text-gray-600">
                  {selectedNode.type === 'trivia' && "Responde 5 preguntas sobre tu pareja para demostrar cuánto sabes."}
                  {selectedNode.type === 'photo' && "Identifica dónde fue tomada esta foto de su primer viaje juntos."}
                  {selectedNode.type === 'gesture' && "Realiza este pequeño acto de amor hoy para fortalecer su vínculo."}
                  {selectedNode.type === 'meta' && "Has completado los objetivos de la semana. ¡Felicidades!"}
                </p>
              </div>

              <button 
                disabled={selectedNode.status === 'locked'}
                className="w-full bg-brand-pink disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-brand-pink/20 transition-all flex items-center justify-center gap-2"
              >
                {selectedNode.status === 'locked' ? (
                  <>Bloqueado aún</>
                ) : (
                  <>¡Empezar Actividad! <ChevronRight size={20} /></>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rewards Side Panel (Overlay) */}
      <AnimatePresence>
        {showRewards && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col"
          >
            <div className="p-6 border-b border-pink-50 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-pink">Tienda de Amor</h2>
              <button 
                onClick={() => setShowRewards(false)}
                className="p-2 hover:bg-pink-50 rounded-full text-brand-dark"
              >
                <ChevronRight className="rotate-90" />
              </button>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 overflow-y-auto">
              <RewardCard title="Cena Romántica" cost={500} icon={<Gift />} />
              <RewardCard title="Masaje" cost={300} icon={<Heart fill="white" stroke="none" />} />
              <RewardCard title="Noche de Pelis" cost={150} icon={<Camera />} />
              <RewardCard title="Voucher: Desayuno" cost={400} icon={<Star fill="white" stroke="none" />} />
              <RewardCard title="Cupón: Sin Discusiones" cost={1000} icon={<Trophy />} />
              <RewardCard title="Beso de 1 min" cost={50} icon={<Flame />} />
            </div>

            <div className="mt-auto p-6 bg-brand-soft border-t border-pink-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-bold uppercase underline">Tu Saldo Actual</span>
                <span className="text-2xl font-bold text-brand-pink">{xp} XP</span>
              </div>
              <button className="bg-brand-coral text-white px-6 py-2 rounded-xl font-bold">Canjear Todo</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Logo({ size = 60 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-pink to-brand-coral rounded-full opacity-10 animate-pulse" />
      <svg viewBox="0 0 24 24" fill="none" className="w-2/3 h-2/3 text-brand-pink drop-shadow-lg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="currentColor" />
        <path d="M12 11c1-1.5 2-2 3.5-2" stroke="white" strokeWidth="1.5" />
      </svg>
      <div className="absolute -bottom-1 text-[10px] font-black text-brand-pink tracking-[0.2em] italic uppercase">AffiniScore</div>
    </div>
  );
}

function ActivityButton({ node, onClick }: { node: ActivityNode, onClick: () => void }) {
  const isLocked = node.status === 'locked';
  const isCurrent = node.status === 'current';

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.1 } : {}}
      whileTap={!isLocked ? { scale: 0.9 } : {}}
      onClick={onClick}
      className={`
        relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors
        ${node.status === 'completed' ? 'bg-brand-pink' : ''}
        ${node.status === 'current' ? 'bg-white border-4 border-brand-pink ring-4 ring-brand-pink/20' : ''}
        ${node.status === 'locked' ? 'bg-gray-200 border-4 border-gray-100 opacity-80' : ''}
      `}
    >
      <div className="text-white">
        {isLocked ? <Gift size={24} className="text-gray-400" /> : getNodeIcon(node.type, node.status)}
      </div>

      {node.status === 'completed' && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
          <ChevronRight size={10} className="text-white rotate-90" />
        </div>
      )}

      {isCurrent && (
        <motion.div 
          className="absolute inset-0 rounded-full border-4 border-brand-pink"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}
    </motion.button>
  );
}

function RewardCard({ title, cost, icon }: { title: string, cost: number, icon: ReactNode }) {
  return (
    <div className="bg-white border border-pink-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 bg-brand-pink rounded-xl flex items-center justify-center text-white mb-3">
        {icon}
      </div>
      <h4 className="font-bold text-brand-dark text-sm mb-1">{title}</h4>
      <div className="flex items-center gap-1 text-brand-pink text-xs font-bold">
        <Star size={12} fill="currentColor" />
        <span>{cost} XP</span>
      </div>
    </div>
  );
}

function getNodeIcon(type: ActivityType, status?: string) {
  const color = status === 'current' ? '#F9A8B1' : 'white';
  switch (type) {
    case 'trivia': return <MessageSquare size={24} fill={color} />;
    case 'photo': return <Camera size={24} fill={color} />;
    case 'gesture': return <Heart size={24} fill={color} />;
    case 'meta': return <Trophy size={24} fill={color} />;
    default: return null;
  }
}

function getNodeColor(type: ActivityType) {
  switch (type) {
    case 'trivia': return 'bg-blue-400';
    case 'photo': return 'bg-brand-coral';
    case 'gesture': return 'bg-purple-400';
    case 'meta': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
}
