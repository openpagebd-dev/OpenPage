'use client';

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Heart, Users, Target, ShieldCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const CausesList = () => {
  const [causes, setCauses] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'causes'));
    const unsub = onSnapshot(q, (snapshot) => {
      setCauses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'causes');
    });
    return () => unsub();
  }, []);

  const handleSupport = async (causeId: string) => {
    if (!auth.currentUser) return;
    try {
      const causeRef = doc(db, 'causes', causeId);
      await updateDoc(causeRef, {
        supporters: increment(1),
        currentAmount: increment(10) // Mock donation
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `cause-${causeId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {causes.map((cause) => (
        <motion.div
          key={cause.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${cause.urgent ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                {cause.urgent ? 'Urgent' : 'Community'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 break-words line-clamp-2">{cause.title}</h3>
            <p className="text-zinc-400 text-sm mb-6 break-words line-clamp-3">{cause.description}</p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-zinc-500">Progress</span>
                <span className="text-white">${cause.currentAmount} / ${cause.goalAmount}</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-600 transition-all duration-1000" 
                  style={{ width: `${Math.min((cause.currentAmount / cause.goalAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-zinc-500 text-xs">
                <Users className="w-4 h-4 mr-1 text-orange-500" />
                {cause.supporters} Backers
              </div>
              <div className="flex items-center text-zinc-500 text-xs">
                <ShieldCheck className="w-4 h-4 mr-1 text-orange-500" />
                Verified
              </div>
            </div>
            <button 
              onClick={() => handleSupport(cause.id)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Support
            </button>
          </div>
        </motion.div>
      ))}
      {causes.length === 0 && (
        <div className="col-span-full py-20 text-center">
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">No Active Causes Found</p>
        </div>
      )}
    </div>
  );
};

export default CausesList;
