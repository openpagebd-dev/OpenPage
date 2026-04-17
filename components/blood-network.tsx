'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { Droplets, ShieldCheck, Heart, Users, Plus, Phone, Hospital as HospitalIcon, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const BloodNetwork = ({ onRequestBlood }: { onRequestBlood: () => void }) => {
  const [stats, setStats] = useState({ livesSaved: 124, activeRequests: 0, donors: 450 });
  const [urgentRequests, setUrgentRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    // Live stats
    // ... same as before
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
    <div className="space-y-6 relative">
      {/* Action Bar */}
      <button 
        onClick={onRequestBlood}
        className="w-full p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center justify-between group hover:bg-red-600/20 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/40">
            <Plus className="text-white w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black uppercase tracking-tight text-white">Request Emergency Blood</div>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Broadcast to nearby donors</div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-red-600/50 transition-colors">
          <Droplets className="w-4 h-4 text-red-600" />
        </div>
      </button>

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
                onClick={() => setSelectedRequest(req)}
              >
                Respond
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Responder Modal Overlay */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md rounded-3xl border border-zinc-800 p-6 flex flex-col justify-center"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl shadow-red-600/40 pulsate">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Connection Bridge</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Direct donor-patient link</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                <HospitalIcon className="w-5 h-5 text-zinc-600" />
                <div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Hospital Location</div>
                  <div className="text-sm font-bold text-white">{selectedRequest.hospital}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Phone className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-pulse hidden" />
                <Phone className="w-5 h-5 text-zinc-600" />
                <div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Emergency Contact</div>
                  <div className="text-sm font-bold text-white tracking-widest">{selectedRequest.contactInfo}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="py-3 bg-zinc-900 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:bg-zinc-800 transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={() => {
                  window.location.href = `tel:${selectedRequest.contactInfo}`;
                }}
                className="py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 transition-colors"
              >
                <Phone className="w-3 h-3" />
                Initiate Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BloodNetwork;
