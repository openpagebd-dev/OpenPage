'use client';

import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { X, User, Mail, Shield, Droplets, MapPin, Save, LogOut, Heart } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import { signOut } from 'firebase/auth';

interface ProfileModalProps {
  profile: any;
  onClose: () => void;
}

const ProfileModal = ({ profile, onClose }: ProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bloodGroup: profile?.bloodGroup || '',
    isDonor: profile?.isDonor || false,
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, formData);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                <User className="text-zinc-400 w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none">Intelligence Profile</h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Personnel Authorization</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Operator Alias</label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                  <User className="w-4 h-4 text-zinc-600 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Enter your name..." 
                    className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-zinc-700 font-bold"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2 mb-2 block">Biological Signature (Blood Group)</label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-orange-500/50 transition-all">
                  <Droplets className="w-4 h-4 text-zinc-600 mr-3" />
                  <select 
                    className="bg-transparent border-none outline-none text-xs w-full text-white appearance-none cursor-pointer font-bold"
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="" className="bg-zinc-950">Not Specified</option>
                    {bloodGroups.map(g => <option key={g} value={g} className="bg-zinc-950">{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.isDonor ? 'bg-red-600/20 text-red-500' : 'bg-zinc-800 text-zinc-600'}`}>
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">Active Donor</div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">Ready for transmission</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isDonor: !formData.isDonor })}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.isDonor ? 'bg-red-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isDonor ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Updating...' : 'Commit Changes'}
              </button>
              <button 
                type="button"
                onClick={handleSignOut}
                className="w-full py-4 bg-zinc-900/50 border border-zinc-800 text-red-600 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Terminal Logout
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileModal;
