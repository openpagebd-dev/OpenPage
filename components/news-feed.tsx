'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc, increment, arrayUnion, serverTimestamp, runTransaction, getDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Eye, Clock, Bookmark, Share2, MessageSquare, Send, ThumbsUp, Heart, Lightbulb, AlertTriangle, Megaphone, Zap, Film, FileText, Download, ChevronLeft, ChevronRight, ExternalLink, Link as LinkIcon, Twitter, Facebook, Copy, Check, BarChart3, User } from 'lucide-react';
import Image from 'next/image';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

import { useFirebase } from './firebase-provider';

const NewsFeed = () => {
  const { user, profile, isAdmin } = useFirebase();
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
  const [sharingArticle, setSharingArticle] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [userPollVotes, setUserPollVotes] = useState<Record<string, string>>({});

  const [sortBy, setSortBy] = useState<'latest' | 'trending'>('latest');

  useEffect(() => {
    if (!user || articles.length === 0) return;
    
    // Fetch user reactions for these articles locally
    const fetchUserReactions = async () => {
      const reactionsMap: Record<string, string> = {};
      const votesMap: Record<string, string> = {};

      const results = await Promise.all(articles.map(async (art) => {
        const reactionDoc = await getDoc(doc(db, 'articles', art.id, 'userReactions', user.uid));
        const voteDoc = art.poll ? await getDoc(doc(db, 'articles', art.id, 'pollVotes', user.uid)) : null;
        return { 
          id: art.id, 
          type: reactionDoc.exists() ? reactionDoc.data().type : null,
          vote: voteDoc?.exists() ? voteDoc.data().option : null
        };
      }));
      
      results.forEach(res => {
        if (res.type) reactionsMap[res.id] = res.type;
        if (res.vote) votesMap[res.id] = res.vote;
      });
      setUserReactions(reactionsMap);
      setUserPollVotes(votesMap);
    };

    fetchUserReactions();
  }, [articles, user]);

  const handleShare = async (article: any, platform?: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?article=${article.id}` : '';
    const text = `Intelligence Briefing: ${article.title}`;

    if (!platform && navigator.share) {
      try {
        await navigator.share({ title: article.title, text, url });
        return;
      } catch (e) { /* Fallback to menu */ }
    }

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(article.id);
        setTimeout(() => setCopySuccess(null), 2000);
      } catch (e) { console.error('Failed to copy', e); }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }

    if (!platform) {
      setSharingArticle(sharingArticle === article.id ? null : article.id);
    }
  };

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
    if (!user) return;
    const userId = user.uid;
    const artRef = doc(db, 'articles', articleId);
    const userReactRef = doc(db, 'articles', articleId, 'userReactions', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const artSnap = await transaction.get(artRef);
        if (!artSnap.exists()) return;
        
        const userReactSnap = await transaction.get(userReactRef);
        const existingType = userReactSnap.exists() ? userReactSnap.data().type : null;

        const reactions = artSnap.data().reactions || {};

        if (existingType === type) {
          // Toggle off: Decrement current
          transaction.delete(userReactRef);
          transaction.update(artRef, {
            [`reactions.${type}`]: Math.max(0, (reactions[type] || 0) - 1),
            updatedAt: serverTimestamp()
          });
        } else if (existingType) {
          // Switch: Decrement old, increment new
          transaction.update(userReactRef, { type, updatedAt: serverTimestamp() });
          transaction.update(artRef, {
            [`reactions.${existingType}`]: Math.max(0, (reactions[existingType] || 0) - 1),
            [`reactions.${type}`]: (reactions[type] || 0) + 1,
            updatedAt: serverTimestamp()
          });
        } else {
          // New: Increment new
          transaction.set(userReactRef, { 
            type, 
            userId,
            articleId,
            createdAt: serverTimestamp() 
          });
          transaction.update(artRef, {
            [`reactions.${type}`]: (reactions[type] || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      // Speculative state update for instant feedback
      setUserReactions(prev => {
        const next = {...prev};
        if (prev[articleId] === type) {
          delete next[articleId];
        } else {
          next[articleId] = type;
        }
        return next;
      });

    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `article-reaction-${articleId}`);
    }
  };

  const submitComment = async (articleId: string) => {
    if (!commentText.trim() || !user) return;
    try {
      const artRef = doc(db, 'articles', articleId);
      await updateDoc(artRef, {
        comments: arrayUnion({
          id: Math.random().toString(36).substr(2, 9),
          uid: user.uid,
          authorName: user.displayName || 'Contributor',
          text: commentText,
          createdAt: new Date().toISOString()
        })
      });
      setCommentText('');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `comment-on-${articleId}`);
    }
  };

  const updateStatus = async (articleId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin && articles.find(a => a.id === articleId)?.authorId !== user?.uid) return;

    const nextStatusMap: Record<string, string> = {
      'Pending': 'Solved',
      'Solved': 'Failed',
      'Failed': 'Pending'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'Pending';

    try {
      const docRef = doc(db, 'articles', articleId);
      await updateDoc(docRef, { itemStatus: nextStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${articleId}`);
    }
  };

  const handlePollVote = async (articleId: string, option: string) => {
    if (!user) return;
    const artRef = doc(db, 'articles', articleId);
    const voteRef = doc(db, 'articles', articleId, 'pollVotes', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const artSnap = await transaction.get(artRef);
        const voteSnap = await transaction.get(voteRef);

        if (!artSnap.exists()) return;
        if (voteSnap.exists()) return; 

        const poll = artSnap.data().poll;
        if (!poll) return;

        transaction.set(voteRef, { option, createdAt: serverTimestamp() });
        transaction.update(artRef, {
          [`poll.votes.${option.replace(/\./g, '_')}`]: increment(1),
          'poll.totalVotes': increment(1),
          updatedAt: serverTimestamp()
        });
      });

      setUserPollVotes(prev => ({ ...prev, [articleId]: option }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `poll-vote-${articleId}`);
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

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'latest') {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) || 0;
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) || 0;
      return timeB - timeA;
    }
    if (sortBy === 'trending') {
      const getScore = (art: any) => {
        const reactions = Object.values(art.reactions || {}).reduce((sum: number, val: any) => sum + (val || 0), 0);
        const commentCount = art.comments?.length || 0;
        const totalVotes = art.poll?.totalVotes || 0;
        return reactions + commentCount * 2 + totalVotes;
      };
      return getScore(b) - getScore(a);
    }
    return 0;
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-600/10">
            <Zap className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white leading-tight">Intelligence Stream</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Sync Protocol</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center self-start md:self-auto gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/60 backdrop-blur-xl">
          <button 
            onClick={() => setSortBy('latest')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${sortBy === 'latest' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/80'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Latest
          </button>
          <button 
            onClick={() => setSortBy('trending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${sortBy === 'trending' ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/80'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Trending
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sortedArticles.flatMap((article, index) => {
          const items = [
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative bg-[#0a0a0b] border border-zinc-800/60 rounded-[2rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500"
            >
              <div className="md:flex">
                {article.imageUrl && !article.media?.length && (
                  <div className="relative h-64 md:h-auto md:w-[35%] lg:w-[40%] shrink-0 overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-60 md:hidden" />
                  </div>
                )}
                
                {article.media && article.media.length > 0 && (
                  <div className="relative h-72 md:h-auto md:w-[35%] lg:w-[40%] shrink-0 overflow-hidden bg-black border-r border-zinc-900/50">
                    <div className="h-full flex flex-col">
                      <div className="flex-1 relative overflow-hidden group/media">
                        {article.media[0].type === 'image' ? (
                          <Image
                            src={article.media[0].url}
                            alt={article.media[0].name}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : article.media[0].type === 'video' ? (
                          <video 
                            src={article.media[0].url} 
                            controls 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-900/50">
                            <FileText className="w-16 h-16 text-zinc-700 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 truncate max-w-full">{article.media[0].name}</p>
                            <a 
                              href={article.media[0].url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-orange-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-orange-500 transition-all flex items-center gap-2"
                            >
                              <Download className="w-3 h-3" /> Download Artifact
                            </a>
                          </div>
                        )}
                        {article.media.length > 1 && (
                          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full border border-zinc-700 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                            +{article.media.length - 1} Operational Files
                          </div>
                        )}
                      </div>
                      
                      {article.media.length > 1 && (
                        <div className="h-20 bg-zinc-950 border-t border-zinc-900 flex gap-2 p-2 overflow-x-auto scrollbar-hide">
                          {article.media.slice(1, 5).map((m: any, i: number) => (
                            <div key={i} className="h-full aspect-square relative rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                              {m.type === 'image' ? (
                                <Image src={m.url} alt={m.name} fill className="object-cover opacity-50 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                  {m.type === 'video' ? <Film className="w-4 h-4 text-zinc-700" /> : <FileText className="w-4 h-4 text-zinc-700" />}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="p-8 md:p-12 lg:p-14 flex flex-col min-w-0 flex-1">
                  <div>
                    <div className="flex items-center gap-4 mb-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-orange-600/10 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-orange-500/20 shadow-sm">
                          {article.category || 'Intelligence'}
                        </span>
                        {article.itemStatus && (
                          <button 
                            onClick={(e) => updateStatus(article.id, article.itemStatus, e)}
                            disabled={!isAdmin && article.authorId !== user?.uid}
                            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border transition-all ${getStatusColor(article.itemStatus)} ${isAdmin || article.authorId === user?.uid ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'}`}
                          >
                            {article.itemStatus}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center">
                          <User className="w-3 h-3 mr-1.5 text-zinc-600" />
                          {article.authorName || 'Vanguard Agent'}
                        </span>
                        
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center">
                          <Clock className="w-3 h-3 mr-1.5 text-zinc-600" />
                          {article.createdAt?.toDate?.() ? article.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Syncing...'}
                        </span>

                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center">
                          <FileText className="w-3 h-3 mr-1.5 text-zinc-600" />
                          {article.content ? article.content.trim().split(/\s+/).length : 0} Words
                        </span>
                      </div>
                    </div>

                    {/* Integrated Polling Matrix */}
                    {article.poll && (
                      <div className="mt-8 mb-4 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/20 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-white leading-none">Diagnostic Matrix</h4>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Community Validation Protocol</p>
                          </div>
                        </div>
                        
                        <p className="text-sm font-bold text-zinc-300 mb-6 tracking-tight">{article.poll.question}</p>
                        
                        <div className="space-y-3">
                          {article.poll.options.map((opt: string, i: number) => {
                            const voteKey = opt.replace(/\./g, '_');
                            const votes = article.poll.votes?.[voteKey] || 0;
                            const total = article.poll.totalVotes || 0;
                            const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
                            const hasVoted = userPollVotes[article.id];

                            return (
                              <button
                                key={`${article.id}-opt-${i}`}
                                disabled={!!hasVoted}
                                onClick={() => handlePollVote(article.id, opt)}
                                className={`group/poll w-full relative h-12 rounded-xl border transition-all overflow-hidden ${hasVoted === opt ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}`}
                              >
                                {/* Progress Bar Overlay */}
                                {(hasVoted || isAdmin) && (
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    className={`absolute inset-y-0 left-0 ${hasVoted === opt ? 'bg-orange-600/20' : 'bg-zinc-800/40'}`}
                                  />
                                )}
                                
                                <div className="absolute inset-0 px-4 flex items-center justify-between pointer-events-none">
                                  <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${hasVoted === opt ? 'text-orange-500' : 'text-zinc-400 group-hover/poll:text-white'}`}>
                                    {opt}
                                  </span>
                                  {(hasVoted || isAdmin) && (
                                    <span className="text-[10px] font-mono font-bold text-zinc-500">
                                      {percentage}% <span className="text-[8px] opacity-40">({votes})</span>
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        
                        {(userPollVotes[article.id] || isAdmin) && (
                          <div className="mt-4 flex items-center justify-between px-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">Total Validations Recorded: {article.poll.totalVotes || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-500">Node Participation Verified</span>
                          </div>
                        )}
                      </div>
                    )}

                    <h3 className="text-2xl md:text-3xl font-black text-white group-hover:text-orange-500 transition-colors mb-4 leading-[1.1] tracking-tight uppercase break-words pr-2">
                      {article.title}
                    </h3>
                    <div className="relative group/content overflow-hidden">
                      <p className={`text-zinc-400 text-sm md:text-base leading-relaxed font-medium transition-all duration-500 break-words ${expandedArticles.includes(article.id) ? '' : 'line-clamp-4'}`}>
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
                  
                  <div className={`flex flex-col gap-6 ${!expandedArticles.includes(article.id) ? 'mt-auto' : 'mt-10'}`}>
                    <div className="flex items-center justify-between pt-10 border-t border-zinc-900/80">
                      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide no-scrollbar -ml-1">
                        {reactionTypes.map(react => (
                          <button 
                            key={react.type}
                            onClick={() => handleReaction(article.id, react.type)}
                            className={`flex items-center text-[10px] font-black uppercase transition-all px-2 py-1 rounded-lg hover:bg-zinc-900 border ${userReactions[article.id] === react.type ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 'text-zinc-500 border-transparent hover:border-zinc-800'} ${react.color}`}
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
                        <div className="relative">
                          <button 
                            onClick={() => handleShare(article)}
                            className={`p-2 transition-all rounded-xl hover:bg-zinc-900 ${sharingArticle === article.id ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-500 hover:text-white'}`}
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                          
                          <AnimatePresence>
                            {sharingArticle === article.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="space-y-1">
                                  <button 
                                    onClick={() => handleShare(article, 'copy')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900 rounded-xl transition-all group/item"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/item:border-orange-500/50 transition-colors">
                                      {copySuccess === article.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover/item:text-white">
                                      {copySuccess === article.id ? 'Copied' : 'Copy Link'}
                                    </span>
                                  </button>
                                  
                                  {[
                                    { id: 'twitter', name: 'Twitter / X', icon: <Twitter className="w-4 h-4" /> },
                                    { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-4 h-4" /> },
                                    { id: 'whatsapp', name: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
                                  ].map((p) => (
                                    <button 
                                      key={p.id}
                                      onClick={() => handleShare(article, p.id)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900 rounded-xl transition-all group/item"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/item:border-orange-500/50 transition-colors">
                                        <div className="text-zinc-500 group-hover/item:text-orange-500 transition-colors">{p.icon}</div>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover/item:text-white">
                                        {p.name}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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
