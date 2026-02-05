import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
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

// Custom slim pin icon using SVG with label
const createPinIcon = (label?: string) => {
  const shortLabel = label ? label.substring(0, 2).toUpperCase() : '📍';
  return new DivIcon({
    className: 'custom-pin-marker',
    html: `<div class="pin-marker-icon">
      <svg viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#dc2626"/>
        <circle cx="12" cy="12" r="8" fill="white"/>
      </svg>
      <span class="pin-label">${shortLabel}</span>
    </div>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    tooltipAnchor: [0, -30],
  });
};

const getZoneLabel = (zone?: string) => {
  switch(zone) {
    case 'pattaya': return 'พัทยา';
    case 'bangsaen': return 'บางแสน';
    case 'sattahip': return 'สัตหีบ';
    case 'rayong': return 'ระยอง';
    default: return '';
  }
};

interface MapComponentProps {
  markers: MarkerData[];
  onMarkerFocus: (markerId: string) => void;
  focusMarkerId?: string | null;
  selectedZone?: string;
}

const defaultCenter: [number, number] = [13.7563, 100.5018]; // Bangkok, Thailand

// Component to auto-center map when markers change
function MapUpdater({ markers, focusMarkerId, selectedZone }: { markers: MarkerData[]; focusMarkerId?: string | null; selectedZone?: string }) {
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
        map.flyTo(bounds[0], 13, { duration: 0.5 });
      } else {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
      }
    }
  }, [markers, map, focusMarkerId, selectedZone]);

  return null;
}

const MarkerWithTooltip = ({
  marker,
  onMarkerFocus,
  isFocused,
  tooltipOffset = 0
}: {
  marker: MarkerData;
  onMarkerFocus: (markerId: string) => void;
  isFocused: boolean;
  tooltipOffset?: number;
}) => {
  const markerRef = useRef<LeafletMarker | null>(null);

  // Open tooltip when focused (from list click or marker click)
  useEffect(() => {
    if (isFocused && markerRef.current) {
      // Small delay to ensure tooltip is ready after cluster unspiderfy
      const timer = setTimeout(() => {
        if (markerRef.current) {
          const tooltip = markerRef.current.getTooltip();
          if (tooltip) {
            (tooltip as any).options.permanent = true;
          }
          markerRef.current.openTooltip();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  return (
    <Marker
      ref={(ref) => {
        markerRef.current = ref;
        // Open tooltip immediately if already focused when ref is set
        if (isFocused && ref) {
          setTimeout(() => {
            const tooltip = ref.getTooltip();
            if (tooltip) {
              (tooltip as any).options.permanent = true;
            }
            ref.openTooltip();
          }, 150);
        }
      }}
      key={marker.id}
      position={[marker.lat, marker.lng]}
      icon={createPinIcon(marker.name)}
      eventHandlers={{
        click: (e) => {
          e.originalEvent?.stopPropagation?.();
          onMarkerFocus(marker.id);
          // Force open tooltip
          if (markerRef.current) {
            markerRef.current.openTooltip();
          }
        },
        mouseover: () => {
          if (markerRef.current) {
            markerRef.current.openTooltip();
          }
        }
      }}
    >
      <Tooltip 
        permanent={true}
        direction="right" 
        offset={[10, -20 * tooltipOffset]}
        className={`marker-tooltip ${isFocused ? 'tooltip-focused tooltip-expanded' : 'tooltip-compact'}`}
        interactive={true}
      >
        <div className="tooltip-content">
          {marker.calendarLink ? (
            <a 
              href={marker.calendarLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="tooltip-name"
              onClick={(e) => e.stopPropagation()}
            >
              {isFocused ? marker.name : (marker.name?.substring(0, 12) + (marker.name && marker.name.length > 12 ? '...' : '')) || 'ไม่มีชื่อ'}
            </a>
          ) : (
            <span className="tooltip-name">
              {isFocused ? marker.name : (marker.name?.substring(0, 12) + (marker.name && marker.name.length > 12 ? '...' : '')) || 'ไม่มีชื่อ'}
            </span>
          )}
          {isFocused && (
            <div className="tooltip-info">
              {typeof marker.capacity === 'number' && marker.capacity > 0 && (
                <span className="tooltip-detail">👥{marker.capacity}</span>
              )}
              {typeof marker.bedrooms === 'number' && marker.bedrooms > 0 && (
                <span className="tooltip-detail">🛏️{marker.bedrooms}</span>
              )}
              {typeof marker.bathrooms === 'number' && marker.bathrooms > 0 && (
                <span className="tooltip-detail">🚿{marker.bathrooms}</span>
              )}
              {marker.zone && (
                <span className="tooltip-zone">{getZoneLabel(marker.zone)}</span>
              )}
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
};

export const MapComponent = ({ markers, onMarkerFocus, focusMarkerId, selectedZone }: MapComponentProps) => {
  return (
    <div className="map-card">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater markers={markers} focusMarkerId={focusMarkerId} selectedZone={selectedZone} />

        {markers.map((marker, index) => (
          <MarkerWithTooltip
            key={marker.id}
            marker={marker}
            onMarkerFocus={onMarkerFocus}
            isFocused={marker.id === focusMarkerId}
            tooltipOffset={index}
          />
        ))}
      </MapContainer>
    </div>
  );
};
