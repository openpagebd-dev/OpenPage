'use client';

import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, MapPin, Phone, Hospital, X, Loader2, CheckCircle, Info } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface BloodRequestModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const BloodRequestModal = ({ onClose, onSuccess }: BloodRequestModalProps) => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'B+',
    hospital: '',
    contactInfo: '',
    description: '',
    latitude: 23.8103, // Default Dhaka
    longitude: 90.4125
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'emergencies'), {
        type: 'blood_request',
        title: formData.patientName,
        bloodGroup: formData.bloodGroup,
        hospital: formData.hospital,
        contactInfo: formData.contactInfo,
        description: formData.description,
        status: 'active',
        location: {
          lat: formData.latitude,
          lng: formData.longitude
        },
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      setComplete(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'emergencies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-red-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Post Blood Request</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Immediate Life-Support Intel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {complete ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold">Request Broadcasted</h3>
            <p className="text-zinc-500 text-sm">Your emergency node has been activeated on the Live Map.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Patient Name</label>
                <input 
                  required
                  type="text"
                  value={formData.patientName}
                  onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 transition-colors outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Blood Group</label>
                <select 
                  value={formData.bloodGroup}
                  onChange={e => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 transition-colors outline-none appearance-none cursor-pointer"
                >
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Hospital / Location</label>
              <div className="relative">
                <Hospital className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  required
                  type="text"
                  value={formData.hospital}
                  onChange={e => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:border-red-600 transition-colors outline-none"
                  placeholder="e.g. Apollo Hospitals Dhaka"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  required
                  type="tel"
                  value={formData.contactInfo}
                  onChange={e => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:border-red-600 transition-colors outline-none"
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Additional Notes</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 transition-colors outline-none h-24 resize-none"
                placeholder="Specific emergency details..."
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
                By posting, you agree to make this information public on the live map for potential donors to see.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Emergency Node'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BloodRequestModal;
