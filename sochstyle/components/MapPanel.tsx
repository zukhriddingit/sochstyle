'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Barber {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapPanelProps {
  barbers: Barber[];
  userLocation: { lat: number; lng: number } | null;
}

export default function MapPanel({ barbers, userLocation }: MapPanelProps) {
  const position = userLocation ? [userLocation.lat, userLocation.lng] : [41.2995, 69.2401]; // Default to Tashkent
  const zoom = userLocation ? 13 : 11;

  return (
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
      {barbers.map((barber) => (
        barber.lat && barber.lng && (
          <Marker key={barber.id} position={[barber.lat, barber.lng]}>
            <Popup>{barber.name}</Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
