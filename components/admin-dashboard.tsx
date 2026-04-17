'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { 
  Zap, 
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Trash2, 
  Megaphone, 
  BarChart3, 
  FileText,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'content' | 'polls' | 'users'>('overview');
  const [globalSettings, setGlobalSettings] = useState<any>({ adsEnabled: true });
  const [ads, setAds] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newAd, setNewAd] = useState({ title: '', type: 'image', content: '', placement: 'home_banner', active: true, url: '', imageUrl: '' });
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  useEffect(() => {
    // Global Settings Listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setGlobalSettings(docSnap.data());
    });

    // Ads Listener
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Content/Articles Listener (pending review)
    const unsubArticles = onSnapshot(query(collection(db, 'articles')), (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Polls Listener
    const unsubPolls = onSnapshot(collection(db, 'polls'), (snapshot) => {
      setPolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSettings();
      unsubAds();
      unsubArticles();
      unsubPolls();
      unsubUsers();
    };
  }, []);

  const approveArticle = async (id: string) => {
    try {
      await updateDoc(doc(db, 'articles', id), { status: 'published', updatedAt: serverTimestamp() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `article-${id}`);
    }
  };

  const createPoll = async () => {
    if (!newPoll.question || newPoll.options.some(o => !o)) return;
    try {
      const pollRef = doc(collection(db, 'polls'));
      await setDoc(pollRef, {
        question: newPoll.question,
        options: newPoll.options.map(label => ({ label, votes: 0 })),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewPoll({ question: '', options: ['', ''] });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'polls');
    }
  };

  const deleteDocGeneric = async (coll: string, id: string) => {
    try {
      await deleteDoc(doc(db, coll, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${coll}-${id}`);
    }
  };

  const toggleAdsKillSwitch = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        adsEnabled: !globalSettings.adsEnabled 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings-global');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const createAd = async () => {
    if (!newAd.title || !newAd.content) return;
    try {
      await addDoc(collection(db, 'ads'), {
        ...newAd,
        status: 'active',
        createdAt: serverTimestamp()
      });
      setNewAd({ title: '', type: 'image', content: '', placement: 'home_banner', active: true, url: '', imageUrl: '' });
      setIsAddingAd(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'ads');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Editorial Control</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Operational Command Center</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 overflow-x-auto">
          {(['overview', 'ads', 'content', 'polls', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Kill Switch Card */}
            <div className={`p-8 rounded-[2.5rem] border transition-all ${globalSettings.adsEnabled ? 'bg-orange-600/10 border-orange-500/20' : 'bg-red-600/10 border-red-500/20'}`}>
              <div className="flex justify-between items-start mb-6">
                <Megaphone className={`w-10 h-10 ${globalSettings.adsEnabled ? 'text-orange-500' : 'text-red-500'}`} />
                <button 
                  onClick={toggleAdsKillSwitch}
                  className="p-2 bg-zinc-950 rounded-xl hover:scale-110 transition-transform"
                >
                  {globalSettings.adsEnabled ? (
                    <Shield className="w-6 h-6 text-orange-500 fill-orange-500/20" />
                  ) : (
                    <Zap className="w-6 h-6 text-red-500" />
                  )}
                </button>
              </div>
              <h3 className="text-lg font-black uppercase mb-1">Ads Switch</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">Master platform override</p>
              <div className="text-xl font-black text-white">
                {globalSettings.adsEnabled ? 'BROADCASTING' : 'OFFLINE'}
              </div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
              <BarChart3 className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-lg font-black uppercase mb-1">Live Audience</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">Direct active nodes</p>
              <div className="text-xl font-black text-white">1,242 Nodes</div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
              <FileText className="w-10 h-10 text-green-500 mb-6" />
              <h3 className="text-lg font-black uppercase mb-1">Content Flow</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">Pending review</p>
              <div className="text-xl font-black text-white">{articles.filter(a => a.status === 'pending').length} Pending</div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
              <Zap className="w-10 h-10 text-orange-500 mb-6" />
              <h3 className="text-lg font-black uppercase mb-1">Ad Inventory</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">Digital placements</p>
              <div className="text-xl font-black text-white">{ads.length} Actives</div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ads' && (
          <motion.div 
            key="ads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl h-fit">
              <h3 className="text-lg font-black uppercase mb-6 tracking-tight">Deploy Creative</h3>
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Campaign Title"
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm"
                  value={newAd.title}
                  onChange={e => setNewAd({...newAd, title: e.target.value})}
                />
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm appearance-none"
                  value={newAd.placement}
                  onChange={e => setNewAd({...newAd, placement: e.target.value})}
                >
                  <option value="home_banner">Home Top Banner</option>
                  <option value="sidebar">Sidebar Slot</option>
                  <option value="article_middle">Article Middle</option>
                </select>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm appearance-none"
                  value={newAd.type}
                  onChange={e => setNewAd({...newAd, type: e.target.value as any})}
                >
                  <option value="image">Image Link</option>
                  <option value="video">MP4 Video</option>
                  <option value="script">JS Script / AdSense</option>
                </select>
                <input 
                  type="text" 
                  placeholder="URL / Source / Script"
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm"
                  value={newAd.content}
                  onChange={e => setNewAd({...newAd, content: e.target.value})}
                />
              </div>
              <button 
                onClick={createAd}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Initialize
              </button>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map(ad => (
                <div key={ad.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-orange-600/10 text-orange-500 rounded-lg border border-orange-500/20">
                        {ad.placement.replace('_', ' ')}
                      </span>
                      <button onClick={() => deleteDocGeneric('ads', ad.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-white mb-2">{ad.title}</h4>
                    <p className="text-[10px] text-zinc-500 truncate font-mono">{ad.content}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{ad.type}</span>
                    <div className={`flex items-center gap-2 ${ad.active ? 'text-green-500' : 'text-zinc-600'}`}>
                      <span className="text-[8px] font-black uppercase tracking-tighter">{ad.active ? 'Active' : 'Paused'}</span>
                      <div className={`w-8 h-4 rounded-full p-1 transition-colors ${ad.active ? 'bg-green-600' : 'bg-zinc-800'}`}>
                        <div className={`w-2 h-2 bg-white rounded-full transition-all ${ad.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {ads.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                  <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No active campaigns</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {articles.map(article => (
              <div key={article.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className={`w-2 h-10 rounded-full ${article.status === 'published' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <div>
                    <h4 className="font-bold text-white mb-1">{article.title}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{article.category}</span>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">• {article.authorName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {article.status === 'pending' && (
                    <button 
                      onClick={() => approveArticle(article.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Approve
                    </button>
                  )}
                  <button 
                    onClick={() => deleteDocGeneric('articles', article.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Platform editorial queue is empty</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'polls' && (
          <motion.div 
            key="polls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl h-fit">
              <h3 className="text-lg font-black uppercase mb-6 tracking-tight">Deploy Civic Poll</h3>
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Pulse Question?"
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:border-orange-500 transition-all text-sm"
                  value={newPoll.question}
                  onChange={e => setNewPoll({...newPoll, question: e.target.value})}
                />
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2">Binary Vectors</p>
                  {newPoll.options.map((opt, i) => (
                    <input 
                      key={i}
                      type="text" 
                      placeholder={`Option ${i+1}`}
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none focus:border-orange-500 transition-all text-xs"
                      value={opt}
                      onChange={e => {
                        const next = [...newPoll.options];
                        next[i] = e.target.value;
                        setNewPoll({...newPoll, options: next});
                      }}
                    />
                  ))}
                  <button 
                    onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
                    className="text-[10px] text-orange-500 font-black uppercase tracking-widest p-2 hover:bg-orange-500/5 rounded-lg transition-all"
                  >
                    + Add Vector
                  </button>
                </div>
              </div>
              <button 
                onClick={createPoll}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
              >
                Broadcast Poll
              </button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {polls.map(poll => (
                <div key={poll.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between group">
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">{poll.question}</h4>
                    <div className="flex gap-4">
                      {poll.options.map((opt: any, i: number) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{opt.label}</span>
                          <span className="text-xs font-black text-white">{opt.votes} Votes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => deleteDocGeneric('polls', poll.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(userItem => (
                <div key={userItem.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] group relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-lg text-orange-500 overflow-hidden">
                      {userItem.photoURL ? (
                        <img src={userItem.photoURL} alt={userItem.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        userItem.displayName?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{userItem.displayName || 'Anonymous User'}</h4>
                      <p className="text-[10px] text-zinc-500 truncate font-mono">{userItem.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Privilege Level</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        userItem.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        userItem.role === 'contributor' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {userItem.role}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {(['reader', 'contributor', 'admin'] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => updateUserRole(userItem.id, role)}
                          disabled={userItem.email === 'openpagebd@gmail.com'}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${
                            userItem.role === role ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {users.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No active nodes identified in the network</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
