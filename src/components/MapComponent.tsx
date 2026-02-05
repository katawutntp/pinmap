import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MarkerData } from '../types';

// Fix default icon issue in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom house icon
const createHouseIcon = () => new DivIcon({
  className: 'custom-house-marker',
  html: `<div class="house-marker-icon">🏠</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

interface MapComponentProps {
  markers: MarkerData[];
  onMarkerClick: (marker: MarkerData) => void;
  focusMarkerId?: string | null;
}

const defaultCenter: [number, number] = [13.7563, 100.5018]; // Bangkok, Thailand

// Component to auto-center map when markers change
function MapUpdater({ markers, focusMarkerId }: { markers: MarkerData[]; focusMarkerId?: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (focusMarkerId) {
      const focused = markers.find(m => m.id === focusMarkerId);
      if (focused) {
        map.flyTo([focused.lat, focused.lng], 15, { duration: 0.5 });
        return;
      }
    }
    if (markers.length > 0) {
      const bounds = markers.map(m => [m.lat, m.lng] as [number, number]);
      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, map, focusMarkerId]);

  return null;
}

const MarkerWithPopup = ({
  marker,
  onMarkerClick,
  isFocused
}: {
  marker: MarkerData;
  onMarkerClick: (marker: MarkerData) => void;
  isFocused: boolean;
}) => {
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (isFocused && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isFocused]);

  return (
    <Marker
      ref={(ref) => {
        markerRef.current = ref;
      }}
      key={marker.id}
      position={[marker.lat, marker.lng]}
      icon={createHouseIcon()}
    >
      <Popup autoClose={false} closeOnClick={false} className="compact-popup">
        <div className="popup-mini">
          <div className="popup-text">
            {marker.calendarLink ? (
              <a 
                href={marker.calendarLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="popup-name popup-link"
              >
                {marker.name || 'ไม่มีชื่อ'}
              </a>
            ) : (
              <span className="popup-name">{marker.name || 'ไม่มีชื่อ'}</span>
            )}
            <div className="popup-details">
              {typeof marker.capacity === 'number' && marker.capacity > 0 && (
                <span className="popup-detail">👥 {marker.capacity}</span>
              )}
              {typeof marker.bedrooms === 'number' && marker.bedrooms > 0 && (
                <span className="popup-detail">🛏️ {marker.bedrooms}</span>
              )}
              {typeof marker.bathrooms === 'number' && marker.bathrooms > 0 && (
                <span className="popup-detail">🚿 {marker.bathrooms}</span>
              )}
            </div>
          </div>
          <button 
            onClick={() => onMarkerClick(marker)}
            className="popup-edit-btn"
            title="แก้ไข"
          >
            ✏️
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export const MapComponent = ({ markers, onMarkerClick, focusMarkerId }: MapComponentProps) => {
  return (
    <div className="map-card">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="map-container"
        closePopupOnClick={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater markers={markers} focusMarkerId={focusMarkerId} />

        {markers.map((marker) => (
          <MarkerWithPopup
            key={marker.id}
            marker={marker}
            onMarkerClick={onMarkerClick}
            isFocused={marker.id === focusMarkerId}
          />
        ))}
      </MapContainer>
    </div>
  );
};
