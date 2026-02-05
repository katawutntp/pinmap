import type { MarkerData } from '../types';

interface MarkerListProps {
  markers: MarkerData[];
  onSelect: (marker: MarkerData) => void;
  onEdit: (marker: MarkerData) => void;
  focusMarkerId?: string | null;
}

export const MarkerList = ({ markers, onSelect, onEdit, focusMarkerId }: MarkerListProps) => {
  if (markers.length === 0) {
    return (
      <div className="marker-list empty">
        <p>ยังไม่มีหมุด</p>
        <p className="hint">เพิ่มพิกัดด้านบนเพื่อเริ่มต้น</p>
      </div>
    );
  }

  return (
    <div className="marker-list">
      <div className="list-header">
        <span>📍 รายการหมุด ({markers.length})</span>
      </div>
      <div className="list-items">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={`list-item ${marker.id === focusMarkerId ? 'active' : ''}`}
            onClick={() => onSelect(marker)}
          >
            <div className="item-info">
              <span className="item-name">{marker.name || 'ไม่มีชื่อ'}</span>
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
              <span className="item-coords">
                {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </span>
            </div>
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
        ))}
      </div>
    </div>
  );
};
