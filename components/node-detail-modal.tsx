'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, Clock, MapPin, Shield, Zap, AlertCircle, Info, MessageSquare, Share2, Newspaper } from 'lucide-react';

interface NodeDetailModalProps {
  node: any;
  onClose: () => void;
}

const NodeDetailModal = ({ node, onClose }: NodeDetailModalProps) => {
  if (!node) return null;

  const typeConfig = {
    emergency: { color: 'text-red-600', bg: 'bg-red-600/10', icon: AlertCircle, label: 'Critical Alert' },
    blood_request: { color: 'text-red-500', bg: 'bg-red-500/10', icon: Zap, label: 'Blood Network' },
    article: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Newspaper, label: 'Verified Intel' }
  };

  const config = (typeConfig as any)[node.type] || typeConfig.article;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg}`}>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.color} mb-1`}>
                {config.label}
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                {node.title}
              </h2>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-zinc-900 mb-8">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {node.createdAt ? new Date(node.createdAt.seconds * 1000).toLocaleString() : 'Live Stream'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {node.location ? `${node.location.lat.toFixed(4)}, ${node.location.lng.toFixed(4)}` : 'Remote Intelligence'}
              </span>
            </div>
            {node.status && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-zinc-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Status: {node.status}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-zinc-400 text-lg leading-relaxed font-medium mb-8">
              {node.content || node.description || 'Intel briefing currently being updated by the Vanguard AI protocols. Operational awareness is primary. No additional data points reported for this node cluster yet.'}
            </p>
          </div>

          {/* Tactical Specs for specialized types */}
          {node.type === 'blood_request' && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Blood Group</div>
                <div className="text-4xl font-black text-white italic">{node.bloodGroup}</div>
              </div>
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Facility</div>
                <div className="text-xl font-black text-white truncate break-words">{node.hospital}</div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center gap-3">
            <button className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Internal Discussion
            </button>
            <button className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-2xl hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NodeDetailModal;
