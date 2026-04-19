'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertCircle, Droplets, Info, Hospital as HospitalIcon, Clock, Phone } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet fix for marker icons in Next.js
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface MapComponentProps {
  onViewDetails?: (node: any) => void;
}

const MapComponent = ({ onViewDetails }: MapComponentProps) => {
  const [markers, setMarkers] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([23.8103, 90.4125]); // Default Dhaka

  useEffect(() => {
    // Get user geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCenter([position.coords.latitude, position.coords.longitude]);
      });
    }

    // Leaflet icon fix
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    // Real-time listener for articles with location
    const qArticles = query(collection(db, 'articles'), where('status', '==', 'published'), limit(50));
    const unsubArticles = onSnapshot(qArticles, (snapshot) => {
      const articleMarkers = snapshot.docs
        .filter(doc => doc.data().location)
        .map(doc => ({
          id: doc.id,
          type: 'article',
          ...doc.data()
        }));
      
      setMarkers(current => {
        const otherMarkers = current.filter(m => m.type !== 'article');
        return [...otherMarkers, ...articleMarkers];
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles-map');
    });

    // Real-time listener for emergencies
    const qEmergencies = query(collection(db, 'emergencies'), where('status', '==', 'active'));
    const unsubEmergencies = onSnapshot(qEmergencies, (snapshot) => {
      const emergencyMarkers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarkers(current => {
        const articleMarkers = current.filter(m => m.type === 'article');
        return [...articleMarkers, ...emergencyMarkers];
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emergencies-map');
    });

    return () => {
      unsubArticles();
      unsubEmergencies();
    };
  }, []);

  const getMarkerIcon = (type: string) => {
    let color = 'text-orange-500';
    let bgColor = 'bg-orange-500';
    let pulseClass = '';
    let icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

    if (type === 'emergency') {
      bgColor = 'bg-red-600';
      pulseClass = 'emergency-pulse';
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
    } else if (type === 'blood_request') {
      bgColor = 'bg-red-500';
      icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5L12 2 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>';
    }

    return L.divIcon({
      html: `
        <div class="relative group cursor-pointer">
          <div class="absolute inset-0 bg-white/20 rounded-full blur-sm group-hover:blur-md transition-all scale-110"></div>
          <div class="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xl transition-all hover:scale-125 hover:-translate-y-1 active:scale-95 ${bgColor} ${pulseClass}">
            ${icon}
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-zinc-950 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.location.lat, marker.location.lng]}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup className="custom-popup">
              <div className="p-4 min-w-[240px] bg-zinc-950 text-white rounded-2xl border border-zinc-800 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${marker.type === 'emergency' ? 'bg-red-600' : marker.type === 'blood_request' ? 'bg-red-500' : 'bg-orange-500'}`}>
                    {marker.type === 'article' && <Info className="w-4 h-4 text-white" />}
                    {marker.type === 'emergency' && <AlertCircle className="w-4 h-4 text-white" />}
                    {marker.type === 'blood_request' && <Droplets className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-sm leading-none">{marker.title}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{marker.type}</p>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                  {marker.content || marker.description}
                </p>

                {marker.type === 'blood_request' && (
                  <div className="mb-4 p-3 bg-red-600/10 border border-red-600/20 rounded-xl space-y-2">
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Group</span>
                       <span className="text-xs font-black text-white bg-red-600 px-1.5 py-0.5 rounded">{marker.bloodGroup || 'Any'}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <HospitalIcon className="w-3 h-3 text-red-500" />
                       <span className="text-[10px] font-bold text-zinc-300 truncate">{marker.hospital || 'Field Outpost'}</span>
                     </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                    {marker.createdAt ? new Date(marker.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                  {marker.type === 'blood_request' ? (
                    <button 
                      onClick={(e) => {
                        if (marker.contactInfo) window.location.href = `tel:${marker.contactInfo}`;
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                    >
                      <Phone className="w-3 h-3" />
                      Initiate
                    </button>
                  ) : (
                    <button 
                      onClick={() => onViewDetails?.(marker)}
                      className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend/Overlay */}
      <div className="absolute bottom-4 left-4 right-4 md:right-auto md:bottom-6 md:left-6 z-[1000] bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 p-4 md:p-5 rounded-3xl shadow-2xl md:min-w-[200px]">
        <div className="flex items-center justify-between md:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-600 rounded-full" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Node Intel</h4>
          </div>
        </div>
        <div className="flex md:flex-col gap-3 md:gap-3 overflow-x-auto no-scrollbar md:overflow-visible py-2 md:py-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center emergency-pulse border border-white/20">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Emergency</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center border border-white/20">
              <Droplets className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Blood</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Intel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
