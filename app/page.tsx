'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useFirebase } from '@/components/firebase-provider';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  Map as MapIcon, 
  Newspaper, 
  Droplets, 
  Settings, 
  LayoutDashboard,
  Zap,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getIntelligenceBriefing } from '@/lib/gemini';
import Image from 'next/image';

// Dynamic components
const MapComponent = dynamic(() => import('@/components/map-component'), { ssr: false });
const NewsFeed = dynamic(() => import('@/components/news-feed'), { ssr: false });
const BloodNetwork = dynamic(() => import('@/components/blood-network'), { ssr: false });
const DemoSeeder = dynamic(() => import('@/components/demo-seeder'), { ssr: false });

export default function Home() {
  const { user, profile, loading, isAdmin } = useFirebase();
  const [activeTab, setActiveTab] = useState<'map' | 'news' | 'blood' | 'admin'>('map');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'notifications' | 'settings' | 'help'>(null);
  const [notifications] = useState([
    { id: 1, text: "Emergency O- blood needed at CMC", time: "2 min ago", unread: true },
    { id: 2, text: "AI Intelligence Briefing updated", time: "10 min ago", unread: false },
    { id: 3, text: "Local Grid expansion complete", time: "1 hour ago", unread: false },
  ]);

  useEffect(() => {
    // Generate AI briefing if on Home/News
    if (activeTab === 'news' && !briefing) {
      const sampleNews = [
        "Major discovery in local energy systems.",
        "Emergency blood drive scheduled for next Sunday.",
        "Traffic updates for the greater Dhaka area.",
        "Community response team expands reach.",
        "Tech hub innovation sets new records."
      ];
      getIntelligenceBriefing(sampleNews).then(res => setBriefing(res || "Briefing unavailable."));
    }
  }, [activeTab, briefing]);

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-orange-600 rounded-2xl mb-6 shadow-2xl shadow-orange-600/40"
        />
        <h1 className="text-2xl font-black text-white tracking-widest uppercase">OpenPage</h1>
        <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.3em] font-medium animate-pulse">Initializing Pulse...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`fixed lg:relative z-[2000] flex flex-col w-72 h-full bg-zinc-950 border-r border-zinc-900 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight">OpenPage</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-500">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            { id: 'map', label: 'Live Map', icon: MapIcon },
            { id: 'news', label: 'News Feed', icon: Newspaper },
            { id: 'blood', label: 'Blood Network', icon: Droplets },
            { id: 'admin', label: 'Dashboard', icon: LayoutDashboard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-900">
          {!user ? (
            <button 
              onClick={login}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              <User className="w-4 h-4" />
              Login to OpenPage
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                  {user.photoURL && (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || ''} 
                      fill 
                      className="object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold truncate">{user.displayName}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{profile?.role || 'Reader'}</div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-zinc-800 rounded-xl text-xs text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-xl z-[1000]">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-zinc-900 rounded-xl">
              <Menu className="w-6 h-6 text-zinc-400" />
            </button>
            <span className="font-black text-lg uppercase">OpenPage</span>
          </div>

          <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 w-96 group focus-within:border-orange-500/50 transition-all">
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search news, locations, or blood info..." 
              className="bg-transparent border-none outline-none text-xs w-full text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setActiveModal(activeModal === 'notifications' ? null : 'notifications')}
                className="relative p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors"
              >
                <Bell className="w-6 h-6" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border border-zinc-900 animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {activeModal === 'notifications' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-[3000]"
                  >
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest text-orange-500">Alerts</span>
                      <button className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold">Clear All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-zinc-800/50 hover:bg-white/5 transition-colors cursor-pointer ${n.unread ? 'bg-orange-500/5' : ''}`}>
                          <p className="text-sm text-zinc-200 mb-1">{n.text}</p>
                          <span className="text-[10px] text-zinc-600 font-bold">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setActiveModal('settings')}
              className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* FAB for Help */}
        <button 
          onClick={() => setActiveModal('help')}
          className="fixed bottom-8 right-8 z-[1500] group flex items-center gap-3 bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-full shadow-2xl shadow-orange-600/40 transition-all hover:scale-105 active:scale-95"
        >
          <AlertCircle className="w-6 h-6 fill-white text-orange-600" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs tracking-widest whitespace-nowrap">Express Emergency</span>
        </button>

        {/* Dynamic Canvas / Viewport */}
        <div className="flex-1 relative overflow-y-auto">
          {activeTab === 'map' && (
            <div className="absolute inset-0 z-0">
              <MapComponent />
            </div>
          )}

          {activeTab === 'news' && (
            <div className="max-w-4xl mx-auto p-8 space-y-8">
              {/* Intelligence Briefing Section */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-600/10 border border-orange-500/20 p-6 rounded-3xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <Zap className="w-24 h-24 fill-orange-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                      Intelligence Briefing
                    </h2>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-white leading-relaxed">
                    {briefing || "Our neural network is synthesizing today's key developments..."}
                  </p>
                </div>
              </motion.div>

              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Trending Stories</h2>
                <div className="flex gap-2">
                  {['Local', 'Global', 'Tech', 'Life'].map(cat => (
                    <button key={cat} className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <NewsFeed />
            </div>
          )}

          {activeTab === 'blood' && (
            <div className="max-w-2xl mx-auto p-8 space-y-8">
              <div className="text-center">
                <Droplets className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-3xl font-black uppercase">Blood Network</h2>
                <p className="text-zinc-500 mt-2 text-sm italic">Every second counts. Every drop saved lives.</p>
              </div>
              <BloodNetwork />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="max-w-2xl mx-auto p-8 space-y-8">
              <div className="text-center">
                <LayoutDashboard className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">Advance Dashboard</h2>
                <p className="text-zinc-500 text-sm mb-6">
                  {isAdmin 
                    ? "Welcome to the Editorial Control Center. Access your tools below." 
                    : "Access Restricted. You need Contributor or Admin permissions to view the Dashboard."}
                </p>
                {isAdmin && (
                  <button className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:invert transition-all">
                    Launch Editor
                  </button>
                )}
              </div>

              <div className="pt-8 border-t border-zinc-900">
                <DemoSeeder />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button for Emergency */}
      {activeTab === 'map' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 z-[2000] w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 emergency-pulse"
          onClick={() => alert("Reporting Emergency Interface Loading...")}
        >
          <AlertCircle className="w-8 h-8 text-white" />
        </motion.button>
      )}
      {/* Modals Layer */}
      <AnimatePresence>
        {activeModal === 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Vanguard Settings</h2>
                  <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500">✕</button>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Interface Density</h3>
                    <div className="flex gap-2">
                      {['Minimal', 'Standard', 'Tactical'].map(d => (
                        <button key={d} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${d === 'Tactical' ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{d}</button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Neural Mapping</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Enable AI path prediction</p>
                    </div>
                    <div className="w-12 h-6 bg-orange-600 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Platform Node</h3>
                    <div className="text-sm font-mono text-orange-500 truncate">ap-southeast-1.vanguard.openpage</div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-8 py-4 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:invert transition-all"
                >
                  Sync & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeModal === 'help' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase mb-2">Emergency Response</h2>
                <p className="text-zinc-500 text-sm mb-8">Select the emergency type. Your location will be automatically tagged for immediate community assistance.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Medical Emergency', icon: '🚑', color: 'bg-red-600/10 border-red-500/20 text-red-500' },
                    { label: 'Blood Request', icon: '💉', color: 'bg-red-600/10 border-red-500/20 text-red-500' },
                    { label: 'Infrastructure', icon: '⚡', color: 'bg-orange-600/10 border-orange-500/20 text-orange-500' },
                    { label: 'Public Safety', icon: '🛡️', color: 'bg-blue-600/10 border-blue-500/20 text-blue-500' },
                  ].map(type => (
                    <button 
                      key={type.label}
                      onClick={() => { alert('Emergency Broadcast Initiated!'); setActiveModal(null); }}
                      className={`p-6 rounded-3xl border transition-all hover:scale-105 active:scale-95 ${type.color} group`}
                    >
                      <div className="text-3xl mb-3 group-hover:scale-125 transition-transform">{type.icon}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{type.label}</div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className="mt-8 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel Protocol
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
