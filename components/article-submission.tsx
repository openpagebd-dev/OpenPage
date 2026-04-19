// Article Submission Protocol Component
'use client';

import React, { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { X, Send, Image as ImageIcon, Type, Layout, Tag, AlertCircle, ShieldCheck as ShieldCircle, Upload, Film, FileText, Trash2, Plus, BarChart3, ListChecks } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Attachment {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'file';
}

interface ArticleSubmissionProps {
  onClose: () => void;
  onSuccess: () => void;
  initialCategory?: string;
  initialStatus?: string;
}

const ArticleSubmission = ({ onClose, onSuccess, initialCategory, initialStatus }: ArticleSubmissionProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: initialCategory || 'Intelligence',
    imageUrl: '',
    itemStatus: initialStatus || 'Pending',
  });
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollData, setPollData] = useState({
    question: 'Is this intelligence briefing accurate?',
    options: ['Confirmed Authentic', 'Needs Verification', 'Likely Fabricated', 'Inconclusive'],
  });

  const statuses = ['Pending', 'Solved', 'Failed'];

  const categories = [
    'Intelligence',
    'Emergency',
    'Infrastructure',
    'Public Safety',
    'Civic Pulse',
    'Editorial',
    'Community'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const newAttachments = files.map(file => {
      let type: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      
      return {
        file,
        type,
        preview: URL.createObjectURL(file)
      };
    });
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const uploadedMedia = [];
      
      // Upload attachments first
      for (const attachment of attachments) {
        const fileRef = ref(storage, `articles/${Date.now()}_${attachment.file.name}`);
        const snapshot = await uploadBytes(fileRef, attachment.file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedMedia.push({
          url,
          type: attachment.type,
          name: attachment.file.name
        });
      }

      await addDoc(collection(db, 'articles'), {
        ...formData,
        media: uploadedMedia,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Vanguard Node',
        status: 'pending', // Requires admin approval
        poll: pollEnabled ? {
          question: pollData.question,
          options: pollData.options,
          votes: pollData.options.reduce((acc: any, opt: string) => ({ ...acc, [opt]: 0 }), {}),
          totalVotes: 0
        } : null,
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
        className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        <div className="p-6 md:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <Send className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-white leading-none">Content Submission</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Initialize Node Protocol</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Media Upload Zone */}
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Tactical Media Attachments (Photos, Videos, Files)</label>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {attachments.map((att, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group/item"
                          >
                            {att.type === 'image' ? (
                              <Image src={att.preview} alt="Preview" fill className="object-cover" unoptimized />
                            ) : att.type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <Film className="w-8 h-8 text-orange-500" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <FileText className="w-8 h-8 text-zinc-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <p className="text-[8px] text-white truncate font-black uppercase tracking-tighter">{att.file.name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <label className="aspect-square bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group/add">
                        <Plus className="w-6 h-6 text-zinc-600 group-hover/add:text-orange-500 transition-colors" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-2 group-hover/add:text-orange-500 transition-colors">Add Media</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*,.pdf,.doc,.docx" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        processFiles(Array.from(e.dataTransfer.files));
                      }}
                      className="py-12 border-2 border-dashed border-zinc-900 rounded-[2rem] flex flex-col items-center justify-center bg-zinc-950 hover:border-orange-500/30 transition-all text-zinc-600 hover:text-orange-500"
                    >
                      <Upload className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Zone: Drop Files Here</p>
                    </div>
                  </div>
                </div>

                {/* Poll Builder Section */}
                <div className="group">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Integrated Verification Poll</label>
                    <button 
                      type="button"
                      onClick={() => setPollEnabled(!pollEnabled)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${pollEnabled ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}
                    >
                      {pollEnabled ? 'Poll Active' : 'Enable Poll'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {pollEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-1">Verification Query</label>
                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/30 transition-all">
                              <ListChecks className="w-4 h-4 text-zinc-700 mr-3" />
                              <input 
                                type="text"
                                className="bg-transparent border-none outline-none text-xs w-full text-white font-bold"
                                value={pollData.question}
                                onChange={e => setPollData({...pollData, question: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 px-1">Response Matrices (Options)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {pollData.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 group/opt">
                                  <input 
                                    className="bg-transparent border-none outline-none text-xs w-full text-zinc-300 font-bold"
                                    value={opt}
                                    onChange={e => {
                                      const next = [...pollData.options];
                                      next[idx] = e.target.value;
                                      setPollData({...pollData, options: next});
                                    }}
                                  />
                                  {pollData.options.length > 2 && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const next = pollData.options.filter((_, i) => i !== idx);
                                        setPollData({...pollData, options: next});
                                      }}
                                      className="ml-2 p-1 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {pollData.options.length < 6 && (
                                <button 
                                  type="button"
                                  onClick={() => setPollData({...pollData, options: [...pollData.options, 'New Option']})}
                                  className="flex items-center justify-center gap-2 py-2 border border-dashed border-zinc-800 rounded-2xl text-zinc-600 hover:text-orange-500 hover:border-orange-500/50 transition-all text-[9px] font-black uppercase tracking-widest"
                                >
                                  <Plus className="w-3 h-3" /> Add Matrix
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
