'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Droplets, 
  Phone, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface Donor {
  id: string;
  displayName: string;
  bloodGroup: string;
  location?: {
    address?: string;
    city?: string;
  };
  photoURL?: string;
  isDonor: boolean;
  role: string;
  lastDonation?: any;
}

const DonorDirectory = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string | 'All'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    // We set loading initially true in state, and only set it false after first fetch
    // If filter changes, it will update as well. 
    // To avoid the lint error, we don't set it sync in body, 
    // but the effect trigger will handle the snapshot.
    let q = query(
      collection(db, 'users'),
      where('isDonor', '==', true),
      limit(50)
    );

    if (selectedBloodGroup !== 'All') {
      q = query(
        collection(db, 'users'),
        where('isDonor', '==', true),
        where('bloodGroup', '==', selectedBloodGroup),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donorData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donor[];
      setDonors(donorData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donors');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBloodGroup]);

  const handleBloodGroupChange = (bg: string) => {
    setLoading(true);
    setSelectedBloodGroup(bg);
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          donor.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          donor.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Search and Filter Header */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search donors by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
          {/* Blood Group Quick Filter scrollable on mobile */}
          <div className="flex gap-2 shrink-0">
            {bloodGroups.slice(0, 5).map(bg => (
              <button
                key={bg}
                onClick={() => handleBloodGroupChange(bg)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedBloodGroup === bg ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
              >
                {bg}
              </button>
            ))}
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 shrink-0 ${isFilterOpen ? 'bg-zinc-800 border-orange-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
            >
              <Filter className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">More Filters</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              {bloodGroups.map(bg => (
                <button
                  key={bg}
                  onClick={() => handleBloodGroupChange(bg)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBloodGroup === bg ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donor Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-zinc-900 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredDonors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((donor, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={donor.id}
              className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 hover:border-orange-500/30 group transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 relative overflow-hidden group-hover:shadow-lg group-hover:shadow-orange-600/10 transition-all">
                    {donor.photoURL ? (
                      <Image 
                        src={donor.photoURL} 
                        alt={donor.displayName} 
                        fill 
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight mb-1 group-hover:text-orange-500 transition-colors">
                      {donor.displayName || 'Tactical Donor'}
                    </h3>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Verified Operator
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-600/10 border border-orange-500/20 px-3 py-1 rounded-xl">
                  <span className="text-sm font-black text-orange-500">{donor.bloodGroup}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-xs font-medium">
                    {donor.location?.city ? `${donor.location.city}, ${donor.location.address || ''}` : 'Regional Sector'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400">
                  <Droplets className="w-3.5 h-3.5 text-red-500/50" />
                  <span className="text-xs font-medium">
                    {donor.lastDonation ? `Last Active: ${new Date(donor.lastDonation).toLocaleDateString()}` : 'Ready for deployment'}
                  </span>
                </div>
              </div>

              <button className="w-full py-3 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2 group-hover:bg-orange-600 transition-all shadow-xl shadow-transparent group-hover:shadow-orange-600/20 group-active:scale-[0.98]">
                Broadcast Ping
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800">
            <Users className="w-10 h-10 text-zinc-800" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-white italic">Zero Operatives Found</h3>
            <p className="text-zinc-500 text-sm mt-2">No donors match your current intelligence parameters.</p>
          </div>
          <button 
            onClick={() => { handleBloodGroupChange('All'); setSearchQuery(''); }}
            className="px-6 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:invert transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DonorDirectory;
