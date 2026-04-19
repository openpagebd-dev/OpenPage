'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, runTransaction, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, ListChecks, Zap, Check } from 'lucide-react';
import { useFirebase } from './firebase-provider';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const GlobalPolls = () => {
  const { user, isAdmin } = useFirebase();
  const [polls, setPolls] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(
      collection(db, 'polls'),
      where('active', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setPolls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'polls');
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || polls.length === 0) return;

    const fetchVotes = async () => {
      const votesMap: Record<string, string> = {};
      await Promise.all(polls.map(async (poll) => {
        const d = await getDoc(doc(db, 'polls', poll.id, 'userVotes', user.uid));
        if (d.exists()) votesMap[poll.id] = d.data().label;
      }));
      setUserVotes(votesMap);
    };

    fetchVotes();
  }, [user, polls]);

  const handleVote = async (pollId: string, label: string) => {
    if (!user) {
      alert("Encryption cleared. Please authenticate to participate in civic pulse.");
      return;
    }
    
    if (userVotes[pollId]) return;

    const pollRef = doc(db, 'polls', pollId);
    const voteRef = doc(db, 'polls', pollId, 'userVotes', user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const pollSnap = await transaction.get(pollRef);
        if (!pollSnap.exists()) return;

        const data = pollSnap.data();
        const nextOptions = data.options.map((opt: any) => {
          if (opt.label === label) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });

        transaction.set(voteRef, { label, createdAt: serverTimestamp() });
        transaction.update(pollRef, { 
          options: nextOptions,
          updatedAt: serverTimestamp()
        });
      });

      setUserVotes(prev => ({ ...prev, [pollId]: label }));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `vote-on-${pollId}`);
    }
  };

  if (polls.length === 0) return null;

  return (
    <div className="space-y-10">
      {polls.map((poll) => (
        <motion.div 
          key={poll.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <Zap className="w-16 h-16 fill-orange-500" />
          </div>
          
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Civic Pulse</span>
          </div>

          <h4 className="text-sm font-black text-white leading-tight mb-6 uppercase tracking-tight">
            {poll.question}
          </h4>

          <div className="space-y-3">
            {poll.options.map((opt: any, i: number) => {
              const totalVotes = poll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
              const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
              const voted = userVotes[poll.id] === opt.label;
              const hasVoted = !!userVotes[poll.id];

              return (
                <button
                  key={`${poll.id}-opt-${i}`}
                  disabled={hasVoted}
                  onClick={() => handleVote(poll.id, opt.label)}
                  className={`w-full relative h-10 rounded-xl border transition-all overflow-hidden ${voted ? 'border-orange-500 bg-orange-500/10' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 group/opt'}`}
                >
                  {(hasVoted || isAdmin) && (
                     <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`absolute inset-y-0 left-0 ${voted ? 'bg-orange-600/20' : 'bg-zinc-800/40'}`}
                    />
                  )}
                  
                  <div className="absolute inset-0 px-4 flex items-center justify-between pointer-events-none">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${voted ? 'text-orange-500' : 'text-zinc-500 group-hover/opt:text-white'}`}>
                      {opt.label}
                    </span>
                    {(hasVoted || isAdmin) && (
                      <span className="text-[9px] font-mono font-bold text-zinc-600">
                        {percentage}%
                      </span>
                    )}
                  </div>
                  {voted && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-3 h-3 text-orange-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {userVotes[poll.id] && (
            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Sync Verified</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">Node Identified</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default GlobalPolls;
