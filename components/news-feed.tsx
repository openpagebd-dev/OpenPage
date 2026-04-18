'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Eye, Clock, Bookmark, Share2, MessageSquare, Send, ThumbsUp, Heart, Lightbulb, AlertTriangle, Megaphone, Zap } from 'lucide-react';
import Image from 'next/image';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const NewsFeed = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vanguard_bookmarks');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [adIndices, setAdIndices] = useState<number[]>([]);

  useEffect(() => {
    // Global Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setAdsEnabled(docSnap.data().adsEnabled);
    });

    // Content
    const q = query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubArticles = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    });

    // Ads
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsList);
      if (adsList.length > 0) {
        setAdIndices(Array.from({ length: 10 }, () => Math.floor(Math.random() * adsList.length)));
      }
    });

    return () => {
      unsubSettings();
      unsubArticles();
      unsubAds();
    };
  }, []);

  const toggleBookmark = (id: string) => {
    const next = bookmarks.includes(id) 
      ? bookmarks.filter(b => b !== id) 
      : [...bookmarks, id];
    setBookmarks(next);
    localStorage.setItem('vanguard_bookmarks', JSON.stringify(next));
  };

  const handleReaction = async (articleId: string, type: string) => {
    try {
      const artRef = doc(db, 'articles', articleId);
      await updateDoc(artRef, {
        [`reactions.${type}`]: increment(1)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `article-${articleId}`);
    }
  };

  const submitComment = async (articleId: string) => {
    if (!commentText.trim() || !auth.currentUser) return;
    try {
      const artRef = doc(db, 'articles', articleId);
      await updateDoc(artRef, {
        comments: arrayUnion({
          id: Math.random().toString(36).substr(2, 9),
          uid: auth.currentUser.uid,
          authorName: auth.currentUser.displayName || 'Contributor',
          text: commentText,
          createdAt: new Date().toISOString()
        })
      });
      setCommentText('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `comment-on-${articleId}`);
    }
  };

  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'solved': case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const reactionTypes = [
    { type: 'fire', icon: '🔥', color: 'hover:text-orange-500' },
    { type: 'like', icon: <ThumbsUp className="w-3.5 h-3.5" />, color: 'hover:text-blue-500' },
    { type: 'heart', icon: <Heart className="w-3.5 h-3.5" />, color: 'hover:text-red-500' },
    { type: 'insight', icon: <Lightbulb className="w-3.5 h-3.5" />, color: 'hover:text-yellow-500' },
    { type: 'warning', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'hover:text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {articles.flatMap((article, index) => {
          const items = [
            <motion.div
              key={article.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-[#0a0a0b] border border-zinc-800/60 rounded-[2rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500"
            >
              <div className="md:flex">
                {article.imageUrl && (
                  <div className="relative h-56 md:h-auto md:w-2/5 shrink-0 overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-60" />
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <span className="px-3 py-1 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-orange-500/20">
                        {article.category || 'Intelligence'}
                      </span>
                      {article.itemStatus && (
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${getStatusColor(article.itemStatus)}`}>
                          {article.itemStatus}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {article.createdAt?.toDate?.() ? article.createdAt.toDate().toLocaleDateString() : 'Active Now'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors mb-3 leading-tight tracking-tighter italic uppercase">
                      {article.title}
                    </h3>
                    <div className="relative group/content">
                      <p className={`text-zinc-400 text-sm md:text-base leading-relaxed font-medium transition-all duration-500 ${expandedArticles.includes(article.id) ? '' : 'line-clamp-4'}`}>
                        {article.content}
                      </p>
                      {article.content && article.content.length > 200 && (
                        <button 
                          onClick={(e) => toggleExpand(article.id, e)}
                          className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-white transition-colors mt-3 flex items-center gap-1.5 focus:outline-none"
                        >
                          {expandedArticles.includes(article.id) ? (
                            <>Collapse Intel <Zap className="w-3 h-3 fill-orange-500" /></>
                          ) : (
                            <>Decipher Full Briefing <Eye className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex flex-col gap-6 ${!expandedArticles.includes(article.id) ? 'mt-auto' : 'mt-8'}`}>
                    <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80">
                      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
                        {reactionTypes.map(react => (
                          <button 
                            key={react.type}
                            onClick={() => handleReaction(article.id, react.type)}
                            className={`flex items-center text-[10px] font-black uppercase text-zinc-500 ${react.color} transition-all px-2 py-1 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800`}
                          >
                            <span className="mr-1.5">{typeof react.icon === 'string' ? react.icon : react.icon}</span>
                            {article.reactions?.[react.type] || 0}
                          </button>
                        ))}
                        <div className="w-px h-4 bg-zinc-800 mx-1" />
                        <button 
                          onClick={() => setActiveComments(activeComments === article.id ? null : article.id)}
                          className={`flex items-center text-[10px] font-black uppercase transition-all px-2 py-1 rounded-lg hover:bg-zinc-900 border ${activeComments === article.id ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : 'text-zinc-500 border-transparent hover:border-zinc-800'}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          {article.comments?.length || 0}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleBookmark(article.id)}
                          className={`p-2 transition-all rounded-xl hover:bg-zinc-900 ${bookmarks.includes(article.id) ? 'text-orange-500 scale-110' : 'text-zinc-500 hover:text-white'}`}
                        >
                          <Bookmark className={`w-5 h-5 ${bookmarks.includes(article.id) ? 'fill-orange-500' : ''}`} />
                        </button>
                        <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {activeComments === article.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden bg-[#050505] rounded-3xl p-6 border border-zinc-800/80 shadow-inner"
                        >
                          <div className="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            {article.comments?.map((c: any) => (
                              <div key={c.id} className="flex gap-3 items-start group/comm">
                                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-[10px] text-zinc-500">
                                  {c.authorName[0]}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{c.authorName}</span>
                                    <span className="text-[9px] text-zinc-600 font-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-zinc-300 text-xs leading-relaxed">{c.text}</p>
                                </div>
                              </div>
                            ))}
                            {(!article.comments || article.comments.length === 0) && (
                              <div className="text-center py-6">
                                <MessageSquare className="w-6 h-6 text-zinc-800 mx-auto mb-2 opacity-50" />
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">No transmissions identified</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 relative">
                            <input 
                              type="text" 
                              placeholder="Contribute to the intelligence pool..."
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-xs text-white outline-none focus:border-orange-500 transition-all shadow-inner"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && submitComment(article.id)}
                            />
                            <button 
                              onClick={() => submitComment(article.id)}
                              className="w-12 h-12 flex items-center justify-center bg-orange-600 rounded-2xl text-white hover:bg-orange-500 active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ];

          if (adsEnabled && ads.length > 0 && (index + 1) % 3 === 0) {
            items.push(
              <motion.div 
                key={`ad-${article.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-zinc-900/30 border border-zinc-900 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 group"
              >
                <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shrink-0">
                  <Megaphone className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sponsored Intelligence</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {ads[adIndices[Math.floor(index / 3) % adIndices.length] || 0]?.title}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">
                    {ads[adIndices[Math.floor(index / 3) % adIndices.length] || 0]?.content}
                  </p>
                </div>
                <button className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                  Synchronize
                </button>
              </motion.div>
            );
          }

          return items;
        })}
      </AnimatePresence>
    </div>
  );
};

export default NewsFeed;
