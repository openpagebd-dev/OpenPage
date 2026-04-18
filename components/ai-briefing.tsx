'use client';

import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, AlertCircle, Info, Sparkles } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

interface Briefing {
  id: string;
  content: string;
  mood: string;
  timestamp: any;
}

const AIBriefing = () => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  const generateBriefing = async () => {
    try {
      // 1. Fetch recent articles
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const news = snapshot.docs.map(doc => doc.data().title + ": " + doc.data().content).join("\n---\n");

      if (!news) {
        setLoading(false);
        return;
      }

      // 2. Call Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are the Vanguard Tactical AI. Analyze the provided community reports and generate a concise, high-impact tactical briefing (max 3 sentences). Use military/cyberpunk terminology. Determine the overall 'mood' of the sector (Stable, Volatile, or Critical).",
        },
        contents: `Latest Intel:\n${news}`,
      });

      const text = response.text || "No briefing available at this time.";
      const moodMatch = text.match(/(Stable|Volatile|Critical)/i);
      const mood = moodMatch ? moodMatch[0] : 'Stable';

      // 3. Save to Firestore
      const newBriefing = {
        content: text,
        mood: mood,
        timestamp: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'briefings'), newBriefing);
      setBriefing({ id: docRef.id, ...newBriefing, timestamp: new Date() } as any);
    } catch (error) {
      console.error("Briefing Generation Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLatest = async () => {
      const q = query(collection(db, 'briefings'), orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const age = Date.now() - (data.timestamp?.toDate().getTime() || 0);
        
        // Refresh if older than 1 hour
        if (age < 3600000) {
          setBriefing({ id: snapshot.docs[0].id, ...data } as any);
          setLoading(false);
        } else {
          generateBriefing();
        }
      } else {
        generateBriefing();
      }
    };

    fetchLatest();
  }, []);

  if (loading) return (
    <div className="w-full h-24 bg-zinc-900 animate-pulse rounded-2xl mb-6 border border-zinc-800 flex items-center justify-center">
      <Zap className="w-5 h-5 text-orange-500 animate-bounce" />
      <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Decrypting Field Intel...</span>
    </div>
  );

  if (!briefing) return null;

  const moodColors: any = {
    Stable: 'text-green-500 bg-green-500/10 border-green-500/20',
    Volatile: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    Critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden mb-8 group"
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-5 blur-3xl rounded-3xl ${briefing.mood === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
      
      <div className="relative bg-[#0a0a0b]/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 md:p-8 overflow-hidden">
        {/* Animated Scanline */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent animate-scanline" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className={`p-4 rounded-2xl border ${moodColors[briefing.mood] || moodColors.Stable}`}>
            <Sparkles className="w-8 h-8" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">System Briefing AC-7</span>
              <div className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${moodColors[briefing.mood] || moodColors.Stable}`}>
                Status: {briefing.mood}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Generated: {briefing.timestamp?.toDate?.() ? briefing.timestamp.toDate().toLocaleTimeString() : 'Current Cypher'}
              </span>
            </div>
            
            <p className="text-zinc-100 text-sm md:text-base leading-relaxed font-medium italic">
              &quot;{briefing.content}&quot;
            </p>
          </div>
          
          <button 
            onClick={() => generateBriefing()}
            className="p-3 text-zinc-600 hover:text-orange-500 transition-colors border border-transparent hover:border-orange-500/20 rounded-xl bg-orange-500/5 active:scale-95"
            title="Refresh Intel"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AIBriefing;
