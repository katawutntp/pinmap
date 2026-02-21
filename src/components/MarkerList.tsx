import type { MarkerData } from '../types';

interface MarkerListProps {
  markers: MarkerData[];
  onSelect: (marker: MarkerData) => void;
  onEdit: (marker: MarkerData) => void;
  onShare: (markerId: string) => void;
  focusedMarkerIds?: string[];
  selectedZone?: string;
}

export const MarkerList = ({ markers, onSelect, onEdit, onShare, focusedMarkerIds, selectedZone }: MarkerListProps) => {
  if (markers.length === 0) {
    return (
      <div className="marker-list empty">
        <p>ยังไม่มีหมุด</p>
        <p className="hint">เพิ่มตำแหน่งในปฏิทิน</p>
      </div>
    );
  }

  const getZoneLabel = (zone?: string) => {
    switch(zone) {
      case 'pattaya': return '🏖️ พัทยา';
      case 'bangsaen': return '🌊 บางแสน';
      case 'sattahip': return '⚓ สัตหีบ';
      case 'rayong': return '🏝️ ระยอง';
      default: return '';
    }
  };

  const getZoneTitle = (zone?: string) => {
    switch(zone) {
      case 'pattaya': return '🏖️ พัทยา';
      case 'bangsaen': return '🌊 บางแสน';
      case 'sattahip': return '⚓ สัตหีบ';
      case 'rayong': return '🏝️ ระยอง';
      default: return '📍 ทั้งหมด';
    }
  };

  return (
    <div className="marker-list">
      <div className="list-header">
        <span>{getZoneTitle(selectedZone)} ({markers.length})</span>
      </div>
      <div className="list-items">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`list-item ${focusedMarkerIds?.includes(marker.id) ? 'active' : ''}`}
            onClick={() => onSelect(marker)}
          >
            <div className="item-info">
              <div className="item-header">
                <span className="item-name">{marker.name || 'ไม่มีชื่อ'}</span>
                {marker.zone && <span className="item-zone">{getZoneLabel(marker.zone)}</span>}
              </div>
              <div className="item-details">
                {typeof marker.capacity === 'number' && marker.capacity > 0 && (
                  <span className="item-detail">👥 {marker.capacity}</span>
                )}
                {typeof marker.bedrooms === 'number' && marker.bedrooms > 0 && (
                  <span className="item-detail">🛏️ {marker.bedrooms}</span>
                )}
                {typeof marker.bathrooms === 'number' && marker.bathrooms > 0 && (
                  <span className="item-detail">🚿 {marker.bathrooms}</span>
                )}
              </div>
            </div>
            <div className="item-actions">
              <button
                className="item-share"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(marker.id);
                }}
                title="แชร์"
              >
                📤
              </button>
              <button
                className="item-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(marker);
                }}
                title="แก้ไข"
              >
                ✏️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
