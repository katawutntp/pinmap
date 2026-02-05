import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

// Custom cluster icon
const createClusterIcon = (count: number) => new DivIcon({
  className: 'custom-cluster-marker',
  html: `<div class="cluster-marker-icon">${count}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

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
  onMarkerClick: (marker: MarkerData) => void;
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
      markerRef.current.openTooltip();
    }
  }, [isFocused]);

  return (
    <Marker
      ref={(ref) => {
        markerRef.current = ref;
      }}
      key={marker.id}
      position={[marker.lat, marker.lng]}
      icon={createPinIcon(marker.name)}
      eventHandlers={{
        click: (e) => {
          e.originalEvent?.stopPropagation?.();
          if (!marker.calendarLink) {
            onMarkerClick(marker);
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
        direction="top" 
        offset={[0, -25]}
        className="marker-tooltip"
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
              {marker.name || 'ไม่มีชื่อ'}
            </a>
          ) : (
            <span className="tooltip-name">{marker.name || 'ไม่มีชื่อ'}</span>
          )}
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
        </div>
      </Tooltip>
    </Marker>
  );
};

export const MapComponent = ({ markers, onMarkerClick, focusMarkerId, selectedZone }: MapComponentProps) => {
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

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={16}
          iconCreateFunction={(cluster: any) => createClusterIcon(cluster.getChildCount())}
        >
          {markers.map((marker) => (
            <MarkerWithTooltip
              key={marker.id}
              marker={marker}
              onMarkerClick={onMarkerClick}
              isFocused={marker.id === focusMarkerId}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
