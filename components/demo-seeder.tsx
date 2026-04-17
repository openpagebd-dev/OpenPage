'use client';

import React, { useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore';
import { Database, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const DemoSeeder = () => {
  const [seeding, setSeeding] = React.useState(false);
  const [complete, setComplete] = React.useState(false);

  const seedData = async () => {
    if (!auth.currentUser) {
      alert("Please login first to seed data.");
      return;
    }
    
    setSeeding(true);
    try {
      const uid = auth.currentUser.uid;
      const authorName = auth.currentUser.displayName || "System Admin";

      // 1. Articles
      const articles = [
        {
          title: "Revolutionary Energy Grid Launched in Dhaka",
          content: "A new smart energy grid has been successfully integrated into the city's power management system, promising 30% more efficiency.",
          category: "Tech",
          status: "published",
          authorId: uid,
          authorName: authorName,
          imageUrl: "https://picsum.photos/seed/energy/800/600",
          location: { lat: 23.8103, lng: 90.4125 },
          reactions: { fire: 12, shock: 2 },
          createdAt: serverTimestamp()
        },
        {
          title: "Blood Drive Crisis: Volunteers Needed at CMC",
          content: "Chattogram Medical College is facing a severe shortage of O- Negative blood. Community response is urged.",
          category: "Emergency",
          status: "published",
          authorId: uid,
          authorName: authorName,
          imageUrl: "https://picsum.photos/seed/blood/800/600",
          location: { lat: 22.3569, lng: 91.7832 },
          reactions: { fire: 5, sad: 15 },
          createdAt: serverTimestamp()
        }
      ];

      for (const art of articles) {
        try {
          await setDoc(doc(collection(db, 'articles')), art);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'articles');
        }
      }

      // 2. Emergencies (Blood Requests)
      const emergencies = [
        {
          type: "blood_request",
          title: "Patient: Mrs. Rahman (Heart Surgery)",
          description: "Urgent B+ blood required at Apollo Hospitals Dhaka.",
          bloodGroup: "B+",
          hospital: "Apollo Hospitals",
          contactInfo: "+8801700000000",
          status: "active",
          location: { lat: 23.8055, lng: 90.4225 },
          createdAt: serverTimestamp()
        },
        {
          type: "emergency",
          title: "Flash Flood Warning: Northern Districts",
          description: "Immediate evacuation alert for low-lying areas in Sylhet department.",
          status: "active",
          location: { lat: 24.8949, lng: 91.8687 },
          createdAt: serverTimestamp()
        }
      ];

      for (const em of emergencies) {
        try {
          await setDoc(doc(collection(db, 'emergencies')), em);
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'emergencies');
        }
      }

      setComplete(true);
    } catch (error: any) {
      console.error("Seeding error:", error);
      alert("Seeding failed: " + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-orange-500" />
        <div>
          <div className="text-sm font-bold">Demo Data Engine</div>
          <div className="text-[10px] text-zinc-500 uppercase font-black uppercase tracking-widest">Hydrate the platform</div>
        </div>
      </div>
      <button 
        onClick={seedData}
        disabled={seeding || complete}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
      >
        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : complete ? <CheckCircle className="w-4 h-4 text-green-500" /> : 'Seed App'}
      </button>
    </div>
  );
};

export default DemoSeeder;
