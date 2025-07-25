import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  members?: any[];
  currentMember?: any;
}

export default function MapView(props: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map<number, L.Marker>());
  const { members = [], currentMember } = props;
  // Add safety check for required props
  if (!members || !Array.isArray(members)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [12.2426, 79.3197], // Tiruvannamalai coordinates
      zoom: 15,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add zoom controls to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers.clear();

    // Add member markers
    members.forEach(member => {
      if (member.latitude && member.longitude) {
        const isCurrentUser = member.id === currentMember?.id;
        const isActive = member.status === 'active';
        const isPaused = member.status === 'paused';
        const isOffline = member.status === 'offline';

        // Create custom icon based on member status
        const iconColor = isCurrentUser ? '#2E7D32' : 
                         isActive ? '#FF7043' : 
                         isPaused ? '#FFC107' : '#D32F2F';

        const icon = L.divIcon({
          html: `
            <div class="relative">
              <div class="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center member-marker" 
                   style="background-color: ${iconColor}">
                <span class="text-white font-bold text-sm">${member.name.charAt(0)}</span>
              </div>
              <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center status-badge ${isOffline ? 'offline' : ''}"
                   style="background-color: ${isActive ? '#4CAF50' : isPaused ? '#FFC107' : '#F44336'}">
                <span class="text-white text-xs">
                  ${isActive ? '✓' : isPaused ? '⏸' : '✗'}
                </span>
              </div>
            </div>
          `,
          className: 'custom-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        const marker = L.marker([member.latitude, member.longitude], { icon })
          .addTo(map);

        // Add popup with member info
        const lastSeen = member.lastSeen ? new Date(member.lastSeen).toLocaleTimeString() : 'Unknown';
        const statusText = isActive ? 'Active' : isPaused ? 'Paused' : 'Offline';
        
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold text-[#1B5E20]">${member.name}</h3>
            <p class="text-sm text-gray-600">${statusText} • ${lastSeen}</p>
          </div>
        `);

        markers.set(member.id, marker);
      }
    });

    // Center map on current user if available
    if (currentMember?.latitude && currentMember?.longitude) {
      map.setView([currentMember.latitude, currentMember.longitude], 16);
    }

    // Draw distance lines between members
    const activeMembers = members.filter(m => m.latitude && m.longitude && m.status === 'active');
    if (activeMembers.length > 1) {
      const polylinePoints = activeMembers.map(m => [m.latitude, m.longitude] as [number, number]);
      
      // Create a polyline connecting all active members
      const polyline = L.polyline(polylinePoints, {
        color: '#FFC107',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
      }).addTo(map);
    }

  }, [members, currentMember]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
