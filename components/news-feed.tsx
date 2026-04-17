'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Eye, Clock, Bookmark, Share2 } from 'lucide-react';
import Image from 'next/image';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const NewsFeed = () => {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'articles'),
      where('status', '==', 'published'), // Required by security rules for public reading
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden hover:bg-zinc-900/60 transition-all duration-300"
          >
            <div className="md:flex">
              {article.imageUrl && (
                <div className="relative h-48 md:h-auto md:w-1/3 shrink-0 overflow-hidden">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent md:hidden" />
                </div>
              )}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-orange-600/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-500/20">
                      {article.category || 'Trending'}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {article.createdAt?.toDate?.() ? article.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors mb-2 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {article.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center text-xs text-zinc-500 hover:text-orange-500 transition-colors">
                      <span className="mr-1">🔥</span>
                      {article.reactions?.fire || 0}
                    </button>
                    <button className="flex items-center text-xs text-zinc-500 hover:text-blue-500 transition-colors">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {article.views || 0}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NewsFeed;
