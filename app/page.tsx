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
  AlertCircle,
  Megaphone,
  Heart,
  Shield,
  X,
  Layout,
  Key,
  Eye,
  BarChart4,
  Plus,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getIntelligenceBriefing } from '@/lib/gemini';
import Image from 'next/image';

// Dynamic components
const MapComponent = dynamic(() => import('@/components/map-component'), { ssr: false });
const NewsFeed = dynamic(() => import('@/components/news-feed'), { ssr: false });
const BloodNetwork = dynamic(() => import('@/components/blood-network'), { ssr: false });
const DemoSeeder = dynamic(() => import('@/components/demo-seeder'), { ssr: false });
const AdminDashboard = dynamic(() => import('@/components/admin-dashboard'), { ssr: false });
const CausesList = dynamic(() => import('@/components/causes-list'), { ssr: false });
const AnalyticsDashboard = dynamic(() => import('@/components/analytics-dashboard'), { ssr: false });
const ArticleSubmission = dynamic(() => import('@/components/article-submission'), { ssr: false });
const BloodRequestModal = dynamic(() => import('@/components/blood-request-modal'), { ssr: false });
const NodeDetailModal = dynamic(() => import('@/components/node-detail-modal'), { ssr: false });
const ProfileModal = dynamic(() => import('@/components/profile-modal'), { ssr: false });
const DonorDirectory = dynamic(() => import('@/components/donor-directory'), { ssr: false });

export default function Home() {
  const { user, profile, loading, isAdmin } = useFirebase();
  const [activeTab, setActiveTab] = useState<'map' | 'news' | 'blood' | 'admin' | 'causes' | 'analytics' | 'donors'>('map');
  const [density, setDensity] = useState<'Minimal' | 'Standard' | 'Tactical'>('Tactical');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<null | 'notifications' | 'settings' | 'help' | 'submit-content' | 'blood-request' | 'node-detail' | 'profile'>(null);
  const [submissionConfig, setSubmissionConfig] = useState<{ category?: string, status?: string }>({});
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Emergency O- blood needed at CMC", time: "2 min ago", unread: true },
    { id: 2, text: "AI Intelligence Briefing updated", time: "10 min ago", unread: false },
    { id: 3, text: "Local Grid expansion complete", time: "1 hour ago", unread: false },
  ]);

  const trends = [
    { tag: "#DhakaPower", count: "14.2k" },
    { tag: "#BloodDonorHero", count: "8.9k" },
    { tag: "#SylhetEvacuation", count: "12.1k" },
    { tag: "#VanguardIntelligence", count: "5.4k" },
  ];

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

  const densityClasses = {
    Minimal: "p-0",
    Standard: "px-4 py-6 md:p-6",
    Tactical: "px-4 py-8 md:p-10"
  };

  return (
    <div className={`flex h-screen bg-zinc-950 text-white overflow-hidden ${density === 'Minimal' ? 'text-xs' : ''}`}>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1500] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:relative z-[2000] flex flex-col w-72 h-full bg-zinc-950 border-r border-zinc-900 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <span className="text-xl font-black uppercase tracking-tight text-white">OpenPage</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-zinc-900 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {[
            { id: 'map', label: 'Live Map', icon: MapIcon },
            { id: 'news', label: 'News Feed', icon: Newspaper },
            { id: 'blood', label: 'Blood Network', icon: Droplets },
            { id: 'donors', label: 'Donor Directory', icon: Users },
            { id: 'causes', label: 'Active Causes', icon: Shield },
            { id: 'analytics', label: 'Intelligence', icon: BarChart4 },
            { id: 'admin', label: 'Admin Ops', icon: LayoutDashboard },
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
                  <div className="text-sm font-bold truncate text-white">{user.displayName}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'text-orange-500' : 'text-zinc-500'}`}>
                    {isAdmin ? 'System Administrator' : (profile?.role || 'Active Reader')}
                  </div>
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
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-zinc-900 rounded-xl active:scale-95 transition-transform">
              <Menu className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="font-black text-base uppercase tracking-tight">OpenPage</span>
          </div>

          <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 w-72 xl:w-96 group focus-within:border-orange-500/50 transition-all">
            <Search className="w-4 h-4 text-zinc-500 mr-3" />
            <input 
              type="text" 
              placeholder="Search news, locations..." 
              className="bg-transparent border-none outline-none text-xs w-full text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button 
                onClick={() => setActiveModal(activeModal === 'notifications' ? null : 'notifications')}
                className="relative p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors active:scale-95"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
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
                    className="absolute right-0 mt-3 w-80 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-[3000]"
                  >
                    <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Incoming Intel</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-zinc-500 hover:text-white uppercase font-black"
                        >
                          Clear Sync
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                      {notifications.length > 0 ? notifications.map(n => (
                        <motion.div 
                          key={n.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.unread ? 'bg-orange-600/5 border-orange-500/20' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700'}`}
                          onClick={() => {
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? {...notif, unread: false} : notif));
                          }}
                        >
                          <p className="text-xs text-zinc-200 font-medium leading-relaxed mb-2">{n.text}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{n.time}</span>
                            {n.unread && <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />}
                          </div>
                        </motion.div>
                      )) : (
                        <div className="py-12 text-center opacity-40">
                          <Eye className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No active transmissions</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setActiveModal('settings')}
              className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors active:scale-95"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {user && (
              <button 
                onClick={() => setActiveModal('profile')}
                className="flex items-center gap-2 md:gap-3 p-1 pl-2 md:pl-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-orange-500/50 transition-all group active:scale-95"
              >
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none mb-1">
                    {profile?.displayName || user.displayName || 'Operative'}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-orange-500 tracking-[0.2em] leading-none">
                    {profile?.bloodGroup || 'No Sig'}
                  </span>
                </div>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-orange-600 flex items-center justify-center overflow-hidden relative group-hover:shadow-lg group-hover:shadow-orange-600/20 transition-all">
                  {profile?.photoURL ? (
                    <Image src={profile.photoURL} alt="Profile" fill className="object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            )}
          </div>
        </header>

        {/* FAB for Help / Emergency */}
        <button 
          onClick={() => setActiveModal('help')}
          className={`fixed bottom-8 right-8 z-[2000] group flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl ${
            activeTab === 'map' 
              ? 'bg-red-600 shadow-red-600/40 w-16 h-16 rounded-full emergency-pulse' 
              : 'bg-orange-600 shadow-orange-600/40 p-4 rounded-full'
          }`}
        >
          <AlertCircle className={`w-6 h-6 fill-white ${activeTab === 'map' ? 'text-red-600' : 'text-orange-600'}`} />
          {activeTab !== 'map' && (
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-black uppercase text-xs tracking-widest whitespace-nowrap text-white">Express Emergency</span>
          )}
        </button>

        {/* Dynamic Canvas / Viewport */}
        <div className={`flex-1 relative overflow-y-auto overscroll-contain snap-none scroll-smooth hover:scroll-auto ${densityClasses[density]}`} style={{ WebkitOverflowScrolling: 'auto' }}>
          {activeTab === 'map' && (
            <div className="absolute inset-0 z-0">
              <MapComponent onViewDetails={(node) => {
                setSelectedNode(node);
                setActiveModal('node-detail');
              }} />
            </div>
          )}

          {activeTab === 'news' && (
            <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-8">
                {/* News Action Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-orange-600 rounded-full" />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Live Broadcasts</h2>
                  </div>
                  {user && (
                    <button 
                      onClick={() => setActiveModal('submit-content')}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white rounded-2xl transition-all"
                    >
                      <Plus className="w-4 h-4 text-orange-500" />
                      Add News
                    </button>
                  )}
                </div>

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

                <NewsFeed />
              </div>

              {/* Sidebar: Trends & Ads */}
              <aside className="w-full lg:w-80 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">Trending Pulse</h3>
                  <div className="space-y-4">
                    {trends.map(trend => (
                      <div key={trend.tag} className="group cursor-pointer">
                        <div className="text-orange-500 font-bold group-hover:underline">{trend.tag}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black">{trend.count} reports</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Ad Placement */}
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-6 aspect-square flex flex-col justify-center items-center text-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Megaphone className="w-12 h-12 text-zinc-700 mb-4 group-hover:text-orange-500 transition-colors" />
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Vanguard Ads</div>
                  <div className="text-[10px] text-zinc-600 font-black uppercase">Your Campaign Here</div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'admin' && (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
              {!isAdmin ? (
                <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800">
                    <Shield className="w-10 h-10 text-zinc-700" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Access Restricted</h2>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                    The Advanced Dashboard is only available to certified platform contributors and administrators. 
                    Please return to your assigned news briefing or request a higher clearance level.
                  </p>
                  <button 
                    onClick={() => setActiveTab('news')}
                    className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:invert transition-all"
                  >
                    Return to Intel
                  </button>
                  <div className="pt-8 border-t border-zinc-900/50">
                    <DemoSeeder />
                  </div>
                </div>
              ) : (
                <AdminDashboard />
              )}
            </div>
          )}

          {activeTab === 'blood' && (
            <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
              <div className="text-center">
                <Droplets className="w-16 h-16 text-red-600 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white mb-2">Blood Network</h2>
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest leading-relaxed">Every second counts. Every drop saves lives.</p>
              </div>
              <BloodNetwork 
                onRequestBlood={() => setActiveModal('blood-request')} 
                userProfile={profile}
              />
            </div>
          )}

          {activeTab === 'causes' && (
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500 fill-red-500/20" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Humanity Direct</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-tight">Critical Causes</h2>
                </div>
                <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-sm md:border-l-2 border-zinc-800 md:pl-6 leading-relaxed mt-2 md:mt-0">
                  Support verified local humanitarian efforts through the OpenPage Direct Support Network.
                </p>
              </div>
              <CausesList />
            </div>
          )}

          {activeTab === 'donors' && (
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-orange-500 fill-orange-500/20" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Global Network</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-tight">Donor Directory</h2>
                </div>
                <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-sm md:border-l-2 border-zinc-800 md:pl-6 leading-relaxed mt-2 md:mt-0">
                  Search and connect with the Vanguard tactical donor network. Direct verified synchronization for emergency response.
                </p>
              </div>
              <DonorDirectory />
            </div>
          )}
        </div>
      </main>

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
              className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-22xl relative"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-white px-2 border-l-4 border-orange-600">Vanguard Settings</h2>
                  <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 hover:border-zinc-700 transition-all group">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                       <Layout className="w-3.5 h-3.5" /> Interface Density
                    </h3>
                    <div className="flex gap-2">
                      {['Minimal', 'Standard', 'Tactical'].map(d => (
                        <button 
                          key={d} 
                          onClick={() => setDensity(d as any)}
                          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${density === d ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 flex items-center justify-between group hover:border-zinc-700 transition-all">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-zinc-500" /> Google Passkey
                      </h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter mt-1 leading-tight">Enhanced biometric platform security</p>
                    </div>
                    <button 
                      onClick={() => alert("Passkey Protocol Initiated via Google Identity.")}
                      className="px-4 py-2 bg-zinc-800 text-[9px] font-black uppercase text-white hover:bg-zinc-700 rounded-xl transition-all"
                    >
                      Configure
                    </button>
                  </div>

                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 flex items-center justify-between group hover:border-zinc-700 transition-all">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                         <Zap className="w-3.5 h-3.5 text-orange-500" /> Neural Mapping
                      </h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter mt-1 leading-tight">AI-assisted visual path prediction</p>
                    </div>
                    <div className="w-12 h-6 bg-orange-600 rounded-full relative cursor-pointer shadow-inner">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-900/50">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Platform Node Identity</h3>
                    <div className="text-xs font-mono text-zinc-500 truncate bg-black p-3 rounded-xl border border-zinc-900">
                      ap-southeast-1.vanguard.openpage-v2
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-8 py-4 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all shadow-xl"
                >
                  Confirm Sync
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
                    { label: 'Medical Emergency', icon: '🚑', color: 'bg-red-600/10 border-red-500/20 text-red-500', action: () => { setSubmissionConfig({ category: 'Emergency', status: 'Pending' }); setActiveModal('submit-content'); } },
                    { label: 'Blood Request', icon: '💉', color: 'bg-red-600/10 border-red-500/20 text-red-500', action: () => setActiveModal('blood-request') },
                    { label: 'Infrastructure', icon: '⚡', color: 'bg-orange-600/10 border-orange-500/20 text-orange-500', action: () => { setSubmissionConfig({ category: 'Infrastructure', status: 'Pending' }); setActiveModal('submit-content'); } },
                    { label: 'Public Safety', icon: '🛡️', color: 'bg-blue-600/10 border-blue-500/20 text-blue-500', action: () => { setSubmissionConfig({ category: 'Public Safety', status: 'Pending' }); setActiveModal('submit-content'); } },
                  ].map(type => (
                    <button 
                      key={type.label}
                      onClick={type.action}
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

        {activeModal === 'submit-content' && (
          <ArticleSubmission 
            initialCategory={submissionConfig.category}
            initialStatus={submissionConfig.status}
            onClose={() => {
              setActiveModal(null);
              setSubmissionConfig({});
            }}
            onSuccess={() => {
              setNotifications(prev => [
                { 
                  id: Date.now(), 
                  text: "Transmission successful. Content queued for editorial review.", 
                  time: "Just now", 
                  unread: true 
                },
                ...prev
              ]);
            }}
          />
        )}

        {activeModal === 'blood-request' && (
          <BloodRequestModal 
            onClose={() => setActiveModal(null)}
            onSuccess={() => {
              setNotifications(prev => [
                { 
                  id: Date.now(), 
                  text: "Blood emergency node activated. Broadcasting to donor network.", 
                  time: "Just now", 
                  unread: true 
                },
                ...prev
              ]);
            }}
          />
        )}

        {activeModal === 'node-detail' && selectedNode && (
          <NodeDetailModal 
            node={selectedNode}
            onClose={() => {
              setActiveModal(null);
              setSelectedNode(null);
            }}
          />
        )}

        {activeModal === 'profile' && profile && (
          <ProfileModal 
            profile={profile}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
