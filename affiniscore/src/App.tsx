/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  UserProfile, 
  Couple, 
  Mission 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Heart, 
  Trophy, 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LogOut, 
  Link as LinkIcon,
  User as UserIcon,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMission, setShowAddMission] = useState(false);
  const [newMission, setNewMission] = useState({ title: '', description: '', xp: 10 });
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Sync Profile
        const userRef = doc(db, 'users', u.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            xp: 0,
            level: 1,
            streak: 0
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(userDoc.data() as UserProfile);
        }

        // Listen for profile changes
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setProfile(null);
        setCouple(null);
        setMissions([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Couple and Missions
  useEffect(() => {
    if (profile?.coupleId) {
      const coupleRef = doc(db, 'couples', profile.coupleId);
      const unsubCouple = onSnapshot(coupleRef, (doc) => {
        if (doc.exists()) {
          setCouple({ id: doc.id, ...doc.data() } as Couple);
        }
      });

      const missionsRef = collection(db, 'couples', profile.coupleId, 'missions');
      const q = query(missionsRef);
      const unsubMissions = onSnapshot(q, (snapshot) => {
        const m = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        setMissions(m.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      });

      return () => {
        unsubCouple();
        unsubMissions();
      };
    }
  }, [profile?.coupleId]);

  const handleLinkPartner = async () => {
    if (!user || !partnerEmail) return;
    setIsLinking(true);
    try {
      // In a real app, we'd search for the user or use a code. 
      // For this demo, let's assume we can find them or just create the link if they match.
      // This is simplified logic for the CRUD/Login focus.
      const coupleId = `couple_${Date.now()}`;
      const newCouple = {
        user1Id: user.uid,
        user2Id: 'pending_partner', // simplified
        sharedXP: 0,
        streakCount: 1,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'couples', coupleId), newCouple);
      await updateDoc(doc(db, 'users', user.uid), { coupleId });
      
      setPartnerEmail('');
    } catch (error) {
      console.error("Error linking:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const addMission = async () => {
    if (!profile?.coupleId || !newMission.title) return;
    try {
      await addDoc(collection(db, 'couples', profile.coupleId, 'missions'), {
        ...newMission,
        xpReward: Number(newMission.xp),
        status: 'active',
        createdBy: user?.uid,
        coupleId: profile.coupleId,
        createdAt: serverTimestamp()
      });
      setNewMission({ title: '', description: '', xp: 10 });
      setShowAddMission(false);
    } catch (error) {
      console.error("Error adding mission:", error);
    }
  };

  const toggleMission = async (mission: Mission) => {
    if (!profile?.coupleId) return;
    const newStatus = mission.status === 'active' ? 'completed' : 'active';
    try {
      await updateDoc(doc(db, 'couples', profile.coupleId, 'missions', mission.id), {
        status: newStatus
      });
      
      if (newStatus === 'completed') {
        const newXP = (profile.xp || 0) + mission.xpReward;
        const newLevel = Math.floor(newXP / 100) + 1;
        await updateDoc(doc(db, 'users', user!.uid), { 
          xp: newXP,
          level: newLevel
        });
      }
    } catch (error) {
      console.error("Error updating mission:", error);
    }
  };

  const deleteMission = async (id: string) => {
    if (!profile?.coupleId) return;
    try {
      await deleteDoc(doc(db, 'couples', profile.coupleId, 'missions', id));
    } catch (error) {
      console.error("Error deleting mission:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep text-accent">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-8 h-0.5 bg-accent mb-2" />
          <span className="font-serif italic text-xl">Nexus</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg-deep">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full bg-bg-card border border-border-main rounded-sm p-12 text-center"
        >
          <div className="flex justify-center mb-8">
            <div className="w-10 h-0.5 bg-accent mb-4" />
          </div>
          <h1 className="italic-header text-4xl mb-2">AffiniScore</h1>
          <p className="user-status mb-12">Puntos para tu relación • Creciendo Juntos</p>
          
          <button 
            onClick={loginWithGoogle}
            className="btn-gold w-full flex items-center justify-center gap-3"
          >
            <UserIcon size={16} />
            Ingresar con Google
          </button>
          
          <p className="mt-8 text-[10px] text-text-dim uppercase tracking-widest leading-relaxed">
            fbase_0x4421 • Secure Authentication Nexus
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] bg-bg-surface border-r border-border-main p-8 flex flex-col hidden md:flex">
        <div className="mb-12">
          <div className="w-8 h-0.5 bg-accent mb-2" />
          <span className="font-serif italic text-2xl text-text-main">AffiniScore</span>
        </div>
        
        <nav className="flex flex-col gap-6">
          <button className="nav-item text-left text-sm transition-colors text-accent flex items-center gap-2">
            <Heart size={16} /> Escritorio
          </button>
          <button className="nav-item text-left text-sm transition-colors text-text-dim hover:text-text-main flex items-center gap-2">
            <Zap size={16} /> Trivias
          </button>
          <button className="nav-item text-left text-sm transition-colors text-text-dim hover:text-text-main flex items-center gap-2">
            <Trophy size={16} /> Logros
          </button>
          <button className="nav-item text-left text-sm transition-colors text-text-dim hover:text-text-main flex items-center gap-2">
            <UserIcon size={16} /> Perfil
          </button>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={logout}
            className="nav-item text-left text-sm transition-colors text-red-900/60 hover:text-red-400 flex items-center gap-2"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="px-10 py-10 border-b border-border-main flex items-center justify-between">
          <h1 className="italic-header text-3xl">Gestión de Relación</h1>
          <div className="user-status hidden sm:block">
            Autenticado como: {user.displayName?.split(' ')[0]}_Nexus
          </div>
          <button onClick={logout} className="md:hidden text-text-dim"><LogOut size={20}/></button>
        </header>

        <main className="p-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          <section className="space-y-10">
            {/* Quick Stats */}
            <div className="bg-bg-card border border-border-main p-8 flex items-center gap-8">
              <img 
                src={user.photoURL || ''} 
                alt={user.displayName || 'Me'} 
                className="w-20 h-20 border border-border-main p-1"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif italic text-xl">{user.displayName}</h2>
                  <span className="user-status text-accent">Nivel {profile?.level}</span>
                </div>
                <div className="relative h-px bg-border-main w-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile?.xp || 0) % 100}%` }}
                    className="absolute top-0 left-0 h-px bg-accent shadow-[0_0_8px_rgba(197,160,89,0.5)]"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-text-dim uppercase tracking-widest">{profile?.xp} Total XP</span>
                  <span className="text-[10px] text-text-dim uppercase tracking-widest">{(profile?.xp || 0) % 100}/100 NEXT</span>
                </div>
              </div>
            </div>

            {/* Missions List */}
            {profile?.coupleId ? (
              <div className="bg-bg-card border border-border-main">
                <div className="bg-[#1d1d1d] px-6 py-3 border-b border-border-main grid grid-cols-[1fr_120px_100px] text-[11px] uppercase tracking-widest text-text-muted">
                  <span>Misión actal</span>
                  <span>Recompensa</span>
                  <span>Estado</span>
                </div>
                
                <div className="divide-y divide-border-main">
                  {missions.map((m) => (
                    <div key={m.id} className="px-6 py-5 grid grid-cols-[1fr_120px_100px] items-center group">
                      <div className="min-w-0 pr-4">
                        <div className={`text-sm font-medium ${m.status === 'completed' ? 'text-text-dim line-through' : ''}`}>
                          {m.title}
                        </div>
                        <div className="text-[11px] text-text-dim mt-1 truncate">{m.description || 'Sin descripción'}</div>
                      </div>
                      
                      <div className="text-xs font-mono text-accent">+{m.xpReward} XP</div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`status-pill ${m.status === 'completed' ? 'opacity-40 grayscale' : ''}`}>
                          {m.status === 'active' ? 'Pendiente' : 'Finalizado'}
                        </span>
                      </div>

                      <div className="col-span-3 mt-4 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleMission(m)}
                          className="text-[11px] text-text-dim underline uppercase hover:text-text-main"
                        >
                          {m.status === 'active' ? 'Marcar como hecho' : 'Reabrir'}
                        </button>
                        <button 
                          onClick={() => deleteMission(m.id)}
                          className="text-[11px] text-red-900/60 underline uppercase hover:text-red-400"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {missions.length === 0 && (
                    <div className="p-12 text-center text-text-dim italic text-sm">
                      No se han registrado misiones hoy.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-bg-card border border-border-main p-12 text-center">
                <div className="inline-block w-8 h-0.5 bg-accent mb-6" />
                <h3 className="font-serif italic text-xl mb-4">Vincular Entidad</h3>
                <p className="text-text-muted text-xs mb-8 uppercase tracking-widest leading-loose">
                  Sincronice su entorno de datos con su pareja para habilitar la arquitectura de progreso compartido.
                </p>
                <div className="max-w-xs mx-auto space-y-4">
                  <input 
                    type="email" 
                    placeholder="Email_del_partner"
                    className="form-input text-center"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                  />
                  <button 
                    onClick={handleLinkPartner}
                    disabled={isLinking}
                    className="btn-gold w-full"
                  >
                    {isLinking ? 'Procesando...' : 'Iniciar Sincronización'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Creation Panel */}
          {profile?.coupleId && (
            <aside className="space-y-6">
              <div className="bg-bg-card border border-border-main p-6">
                <h3 className="font-serif italic text-lg mb-6">Nuevo Registro</h3>
                <div className="space-y-5">
                  <div>
                    <label className="form-label">Título de Misión</label>
                    <input 
                      placeholder="Ej: Auditoría de Afecto"
                      className="form-input"
                      value={newMission.title}
                      onChange={(e) => setNewMission({...newMission, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Detalles técnicos</label>
                    <textarea 
                      placeholder="Descripción del informe..."
                      className="form-input h-24 resize-none"
                      value={newMission.description}
                      onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Categoría de XP</label>
                    <select 
                      className="form-input"
                      value={newMission.xp}
                      onChange={(e) => setNewMission({...newMission, xp: Number(e.target.value)})}
                    >
                      <option value={10}>Estándar (10 XP)</option>
                      <option value={20}>Moderado (20 XP)</option>
                      <option value={50}>Crítico (50 XP)</option>
                    </select>
                  </div>
                  <button 
                    onClick={addMission}
                    disabled={!newMission.title}
                    className="btn-gold w-full mt-4"
                  >
                    Guardar en Firebase
                  </button>
                  <p className="text-[10px] text-text-dim text-center uppercase tracking-widest mt-4">
                    id_transacción: 0x{Date.now().toString(16).slice(-4)}_f
                  </p>
                </div>
              </div>

              {/* Tips/Quotes */}
              <div className="bg-bg-card border border-border-main p-6 border-l-accent border-l-2">
                <p className="text-xs italic text-text-muted leading-relaxed">
                  "El mantenimiento de la relación es un proceso iterativo que requiere consistencia en la ejecución de datos emocionales."
                </p>
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-surface border-t border-border-main px-6 py-4 flex items-center justify-around z-10 md:hidden">
        <Heart className="text-accent" size={20} />
        <Zap className="text-text-dim" size={20} />
        <Plus onClick={() => setShowAddMission(true)} className="text-accent bg-bg-card border border-accent p-1 rounded-full" size={28} />
        <Trophy className="text-text-dim" size={20} />
        <UserIcon className="text-text-dim" size={20} />
      </nav>
    </div>
  );
}
