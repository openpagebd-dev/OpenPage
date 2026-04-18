'use client';

import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Type, Layout, Tag, AlertCircle, ShieldCheck as ShieldCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface ArticleSubmissionProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ArticleSubmission = ({ onClose, onSuccess }: ArticleSubmissionProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Intelligence',
    imageUrl: '',
    itemStatus: 'Pending',
  });

  const statuses = ['Pending', 'Solved', 'Failed'];

  const categories = [
    'Intelligence',
    'Emergency',
    'Infrastructure',
    'Civic Pulse',
    'Editorial',
    'Community'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'articles'), {
        ...formData,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Vanguard Node',
        status: 'pending', // Requires admin approval
        reactions: {
          fire: 0,
          like: 0,
          heart: 0,
          insight: 0,
          warning: 0
        },
        comments: [],
        views: 0,
        createdAt: serverTimestamp(),
      });
      onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'articles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Send className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none">Content Submission</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Initialize Node Protocol</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Primary Header</label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                  <Type className="w-4 h-4 text-zinc-600 mr-3" />
                  <input 
                    required
                    type="text" 
                    placeholder="Enter article headline..." 
                    className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-zinc-700 font-bold"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Classification</label>
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                      <Tag className="w-4 h-4 text-zinc-600 mr-3" />
                      <select 
                        className="bg-transparent border-none outline-none text-xs w-full text-white appearance-none cursor-pointer font-bold"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        {categories.map(c => <option key={c} value={c} className="bg-zinc-950">{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Operational Status</label>
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                      <ShieldCircle className="w-4 h-4 text-zinc-600 mr-3" />
                      <select 
                        className="bg-transparent border-none outline-none text-xs w-full text-white appearance-none cursor-pointer font-bold"
                        value={formData.itemStatus}
                        onChange={e => setFormData({ ...formData, itemStatus: e.target.value })}
                      >
                        {statuses.map(s => <option key={s} value={s} className="bg-zinc-950">{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Visual Asset URL</label>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                    <ImageIcon className="w-4 h-4 text-zinc-600 mr-3" />
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-700"
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Intelligence Data</label>
                <div className="flex items-start bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 focus-within:border-orange-500/50 transition-all min-h-[200px]">
                  <Layout className="w-4 h-4 text-zinc-600 mr-3 mt-1" />
                  <textarea 
                    required
                    placeholder="Provide the core content and intelligence details..." 
                    className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-zinc-700 resize-none h-full min-h-[160px] leading-relaxed"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-orange-600/5 border border-orange-500/20 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase leading-snug">
                Submissions are reviewed by the Editorial Command before public broadcast. Ensure information accuracy.
              </p>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-zinc-800 transition-all"
              >
                Abort
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-orange-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Transmitting...' : 'Broadcast to Queue'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ArticleSubmission;
