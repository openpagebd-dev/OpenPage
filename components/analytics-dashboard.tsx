'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare, 
  Heart, 
  AlertCircle, 
  Droplets,
  Zap,
  Calendar,
  Layers,
  BarChart3,
  Activity,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '@/components/firebase-provider';
import { format } from 'date-fns';

const AnalyticsDashboard = () => {
  const { user, isAdmin } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [userPerformance, setUserPerformance] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // Admin View: Platform-wide Analytics
          const usersSnap = await getDocs(collection(db, 'users'));
          const articlesSnap = await getDocs(collection(db, 'articles'));
          const bloodSnap = await getDocs(query(collection(db, 'emergencies'), where('type', '==', 'blood_request')));
          const emergenciesSnap = await getDocs(query(collection(db, 'emergencies'), where('type', '==', 'emergency')));

          const articles = articlesSnap.docs.map(d => d.data());
          const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
          
          // Category Distribution
          const categories: Record<string, number> = {};
          articles.forEach(a => {
            if (a.category) categories[a.category] = (categories[a.category] || 0) + 1;
          });
          const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

          // User Growth (Mocking timeline based on createdAt)
          const growthData = [
            { name: 'Week 1', users: 120 },
            { name: 'Week 2', users: 300 },
            { name: 'Week 3', users: 650 },
            { name: 'Week 4', users: usersSnap.size },
          ];

          // Blood Network Effectiveness
          const bloodDocs = bloodSnap.docs.map(d => d.data());
          const resolvedBlood = bloodDocs.filter(d => d.status === 'resolved').length;
          const bloodSuccessRate = bloodDocs.length > 0 ? (resolvedBlood / bloodDocs.length) * 100 : 0;

          setPlatformData({
            totalUsers: usersSnap.size,
            totalArticles: articlesSnap.size,
            totalViews,
            categoryData,
            growthData,
            bloodStats: {
              total: bloodDocs.length,
              resolved: resolvedBlood,
              successRate: bloodSuccessRate.toFixed(1)
            },
            emergencyCount: emergenciesSnap.size
          });
        }

        if (user) {
          // Personal View: User-specific Analytics
          const q = query(
            collection(db, 'articles'),
            where('authorId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const snap = await getDocs(q);
          const userArticles = snap.docs.map(d => ({
            id: d.id,
            title: d.data().title?.substring(0, 15) + '...',
            views: d.data().views || 0,
            reactions: Object.values(d.data().reactions || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 1), 0),
            comments: d.data().commentCount || 0,
            date: d.data().createdAt?.toDate ? format(d.data().createdAt.toDate(), 'MMM dd') : 'N/A'
          }));

          setUserPerformance(userArticles);
          
          const totalUserViews = userArticles.reduce((acc, curr) => acc + curr.views, 0);
          const totalUserReactions = userArticles.reduce((acc, curr) => acc + curr.reactions, 0);
          
          setStats({
            totalViews: totalUserViews,
            totalReactions: totalUserReactions,
            articleCount: userArticles.length
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Aggregating Vectors...</p>
      </div>
    );
  }

  const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8 p-4 md:p-8 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">
            Intelligence <span className="text-orange-600">Analytics</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">Operational Insights & Node Engagement</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] uppercase font-black tracking-widest text-zinc-400">
          <Activity className="w-4 h-4 text-orange-600" /> Live Pulse Active
        </div>
      </div>

      {isAdmin && platformData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Admin Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-20 h-20 text-orange-600" />
              </div>
              <Users className="w-8 h-8 text-orange-600 mb-6" />
              <div className="text-3xl font-black text-white">{platformData.totalUsers}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Total Active Nodes</div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-20 h-20 text-blue-600" />
              </div>
              <Eye className="w-8 h-8 text-blue-600 mb-6" />
              <div className="text-3xl font-black text-white">{platformData.totalViews.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Platform Impressions</div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Droplets className="w-20 h-20 text-red-600" />
              </div>
              <Droplets className="w-8 h-8 text-red-600 mb-6" />
              <div className="text-3xl font-black text-white">{platformData.bloodStats.successRate}%</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Blood Recovery Rate</div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-20 h-20 text-green-600" />
              </div>
              <AlertCircle className="w-8 h-8 text-green-600 mb-6" />
              <div className="text-3xl font-black text-white">{platformData.bloodStats.total}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Life-Saving Requests</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Growth Chart */}
            <div className="p-8 bg-zinc-900/50 border border-zinc-900 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Node Expansion Protocol</h3>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={platformData.growthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="p-8 bg-zinc-900/50 border border-zinc-900 rounded-[3rem] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Intelligence Distribution</h3>
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div className="h-[300px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {platformData.categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 pr-8">
                  {platformData.categoryData.map((cat: any, i: number) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] font-black uppercase tracking-tight text-white">{cat.name}</span>
                      <span className="text-[10px] font-bold text-zinc-500">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : user ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* User Specific Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <Eye className="w-8 h-8 text-orange-600 mb-6" />
              <div className="text-3xl font-black text-white">{stats.totalViews.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Personal Impact (Views)</div>
            </div>
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <Heart className="w-8 h-8 text-red-600 mb-6" />
              <div className="text-3xl font-black text-white">{stats.totalReactions}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Community Resonances</div>
            </div>
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
              <Calendar className="w-8 h-8 text-blue-600 mb-6" />
              <div className="text-3xl font-black text-white">{stats.articleCount}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Operational Briefings</div>
            </div>
          </div>

          <div className="p-8 bg-zinc-900/50 border border-zinc-900 rounded-[3rem] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Content Resonance Matrix</h3>
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  />
                  <Bar dataKey="views" fill="#ea580c" radius={[4, 4, 0, 0]} name="Views" />
                  <Bar dataKey="reactions" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Reactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
          <Shield className="w-16 h-16 text-zinc-800" />
          <h3 className="text-xl font-black uppercase tracking-widest">Access Protocol Restricted</h3>
          <p className="text-zinc-500 text-sm max-w-sm">Please synchronize your node identity to access biometric analytics and engagement vectors.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
