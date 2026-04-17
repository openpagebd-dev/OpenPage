'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, AlertCircle, Droplets, Info } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet fix for marker icons in Next.js
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

const MapComponent = () => {
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
    let color = '#f27d26'; // Default orange
    if (type === 'emergency') color = '#ef4444';
    if (type === 'blood_request') color = '#dc2626';

    return L.divIcon({
      html: `<div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white ${type === 'emergency' ? 'emergency-pulse bg-red-600' : 'bg-orange-500'}">
               ${type === 'blood_request' ? '<span class="text-xs font-bold">B+</span>' : '<i class="lucide-map-pin w-4 h-4"></i>'}
             </div>`,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
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
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{marker.title}</h3>
                <p className="text-sm text-zinc-600 mb-2 truncate">{marker.content || marker.description}</p>
                <div className="flex items-center text-xs text-orange-600 font-semibold">
                  {marker.type === 'article' && <Info className="w-3 h-3 mr-1" />}
                  {marker.type === 'emergency' && <AlertCircle className="w-3 h-3 mr-1 text-red-500" />}
                  {marker.type === 'blood_request' && <Droplets className="w-3 h-3 mr-1 text-red-600" />}
                  {marker.type.toUpperCase()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend/Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl">
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Live Intelligence</h4>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 bg-red-600 rounded-full mr-2 emergency-pulse"></span>
            <span>Emergency Pulse</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
            <span>Blood Network</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
            <span>Local News</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
