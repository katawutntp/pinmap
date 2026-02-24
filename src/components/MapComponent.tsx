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

// Calculate distance between two points in degrees
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
};

// Offset overlapping markers in a spiral pattern
const spreadOverlappingMarkers = (markers: MarkerData[]): (MarkerData & { adjustedLat: number; adjustedLng: number; tooltipDir: number })[] => {
  const threshold = 0.0008; // ~80 meters - markers closer than this will be spread
  const offsetAmount = 0.0006; // ~60 meters offset
  
  // Group markers by proximity
  const processed: (MarkerData & { adjustedLat: number; adjustedLng: number; tooltipDir: number })[] = [];
  
  markers.forEach((marker, idx) => {
    let adjustedLat = marker.lat;
    let adjustedLng = marker.lng;
    let tooltipDir = idx % 4;
    
    // Check against all previously processed markers
    let overlapCount = 0;
    for (const pm of processed) {
      const dist = getDistance(adjustedLat, adjustedLng, pm.adjustedLat, pm.adjustedLng);
      if (dist < threshold) {
        overlapCount++;
      }
    }
    
    // If overlapping, spread out in a spiral pattern
    if (overlapCount > 0) {
      const angle = (overlapCount * 90 + 45) * (Math.PI / 180); // 45, 135, 225, 315 degrees
      const radius = offsetAmount * Math.ceil(overlapCount / 4);
      adjustedLat = marker.lat + radius * Math.sin(angle);
      adjustedLng = marker.lng + radius * Math.cos(angle);
      tooltipDir = overlapCount % 4; // Alternate tooltip direction
    }
    
    processed.push({
      ...marker,
      adjustedLat,
      adjustedLng,
      tooltipDir
    });
  });
  
  return processed;
};

interface MapComponentProps {
  markers: MarkerData[];
  onMarkerFocus: (markerId: string) => void;
  onShareMarker?: (markerId: string) => void;
  focusedMarkerIds?: string[];
  selectedZone?: string;
  isShareMode?: boolean;
}

const defaultCenter: [number, number] = [13.7563, 100.5018]; // Bangkok, Thailand

// Component to auto-center map when markers change
function MapUpdater({ markers, focusedMarkerIds, selectedZone }: { markers: MarkerData[]; focusedMarkerIds?: string[]; selectedZone?: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (focusedMarkerIds && focusedMarkerIds.length > 0) {
      // Focus on the last added marker
      const lastFocusId = focusedMarkerIds[focusedMarkerIds.length - 1];
      const focused = markers.find(m => m.id === lastFocusId);
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
  }, [markers, map, focusedMarkerIds, selectedZone]);

  return null;
}

const MarkerWithTooltip = ({
  marker,
  onMarkerFocus,
  onShareMarker,
  isFocused,
  tooltipDir,
  adjustedLat,
  adjustedLng,
  isShareMode
}: {
  marker: MarkerData;
  onMarkerFocus: (markerId: string) => void;
  onShareMarker?: (markerId: string) => void;
  isFocused: boolean;
  tooltipDir: number;
  adjustedLat: number;
  adjustedLng: number;
  isShareMode?: boolean;
}) => {
  // Alternate tooltip direction and offset to prevent overlap
  const directions: Array<'right' | 'left' | 'top' | 'bottom'> = ['right', 'top', 'left', 'bottom'];
  const direction = directions[tooltipDir % 4];
  const offsets: Record<string, [number, number]> = {
    'right': [12, 0],
    'left': [-12, 0],
    'top': [0, -12],
    'bottom': [0, 12]
  };
  const offset = offsets[direction];
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
      position={[adjustedLat, adjustedLng]}
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
        direction={direction} 
        offset={offset}
        className={`marker-tooltip ${isFocused ? 'tooltip-focused tooltip-expanded' : 'tooltip-compact'}`}
        interactive={true}
      >
        <div className="tooltip-content">
          {(() => {
            const displayName = isShareMode ? (marker.apiCode || marker.name || 'ไม่มีชื่อ') : (marker.name || 'ไม่มีชื่อ');
            const shortName = displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName;
            const shownName = isFocused ? displayName : shortName;
            if (!isShareMode && marker.calendarLink) {
              return (
                <a className="tooltip-name" href={marker.calendarLink} target="_blank" rel="noopener noreferrer">
                  {shownName}
                </a>
              );
            }
            return <span className="tooltip-name">{shownName}</span>;
          })()}
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
              {!isShareMode && onShareMarker && (
                <button
                  className="tooltip-share-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareMarker(marker.id);
                  }}
                  title="แชร์หมุดนี้"
                >
                  📤 แชร์
                </button>
              )}
            </div>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
};

export const MapComponent = ({ markers, onMarkerFocus, onShareMarker, focusedMarkerIds, selectedZone, isShareMode }: MapComponentProps) => {
  // Spread overlapping markers
  const spreadMarkers = spreadOverlappingMarkers(markers);
  
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
        
        <MapUpdater markers={markers} focusedMarkerIds={focusedMarkerIds} selectedZone={selectedZone} />

        {spreadMarkers.map((marker) => (
          <MarkerWithTooltip
            key={marker.id}
            marker={marker}
            onMarkerFocus={onMarkerFocus}
            onShareMarker={onShareMarker}
            isFocused={focusedMarkerIds?.includes(marker.id) ?? false}
            tooltipDir={marker.tooltipDir}
            adjustedLat={marker.adjustedLat}
            adjustedLng={marker.adjustedLng}
            isShareMode={isShareMode}
          />
        ))}
      </MapContainer>
    </div>
  );
};
