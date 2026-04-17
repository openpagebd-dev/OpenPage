'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { Droplets, ShieldCheck, Heart, Users } from 'lucide-react';
import { motion } from 'motion/react';

import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const BloodNetwork = () => {
  const [stats, setStats] = useState({ livesSaved: 124, activeRequests: 0, donors: 450 });
  const [urgentRequests, setUrgentRequests] = useState<any[]>([]);

  useEffect(() => {
    // Live stats (simulated totals for demo, but typically would be doc counts)
    const qUrgent = query(
      collection(db, 'emergencies'),
      where('type', '==', 'blood_request'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsub = onSnapshot(qUrgent, (snapshot) => {
      setUrgentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, activeRequests: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blood-requests');
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Board */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Lives Saved', value: stats.livesSaved, icon: Heart, color: 'text-red-500' },
          { label: 'Active', value: stats.activeRequests, icon: Droplets, color: 'text-red-600' },
          { label: 'Donors', value: stats.donors, icon: Users, color: 'text-zinc-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center">
          <Droplets className="w-4 h-4 mr-2 text-red-600" />
          Urgent Blood Requests
        </h3>
        {urgentRequests.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-xs text-zinc-500">No active emergency requests in your area.</p>
          </div>
        ) : (
          urgentRequests.map((req) => (
            <motion.div
              layout
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-600/5 border border-red-600/20 p-4 rounded-2xl flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
                    {req.bloodGroup}
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[120px]">
                    {req.hospital}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                  Patient: {req.title}
                </div>
              </div>
              <button 
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                onClick={() => alert("Connecting you with the donor hub...")}
              >
                Accept
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default BloodNetwork;
