import { useState, useEffect } from 'react';
import type { MarkerData } from '../types';

interface MarkerEditModalProps {
  marker: MarkerData | null;
  onSave: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const MarkerEditModal = ({ marker, onSave, onDelete, onClose }: MarkerEditModalProps) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (marker) {
      setName(marker.name || '');
    }
  }, [marker]);

  if (!marker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(marker.id, name);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px'
      }}>
        <h2 style={{ marginTop: 0 }}>แก้ไขข้อมูลหมุด</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#666' }}>
              พิกัด:
            </label>
            <p style={{ margin: '0 0 16px 0', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '14px' }}>
              {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
            </p>
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              ชื่อสถานที่:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ใส่ชื่อสถานที่"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onDelete(marker.id)}
              style={{
                padding: '10px 20px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ลบหมุด
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#ddd',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
