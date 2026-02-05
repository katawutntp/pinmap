import { useState, useEffect } from 'react';
import type { MarkerData } from '../types';

interface MarkerEditModalProps {
  marker: MarkerData | null;
  onSave: (id: string, name: string, calendarHouseKey: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const MarkerEditModal = ({ marker, onSave, onDelete, onClose }: MarkerEditModalProps) => {
  const [name, setName] = useState('');
  const [calendarHouseKey, setCalendarHouseKey] = useState('');
  const calendarBaseUrl = 'https://baanpoolvilla-calendar.vercel.app/?house=';

  useEffect(() => {
    if (marker) {
      setName(marker.name || '');
      if (marker.calendarLink) {
        try {
          const url = new URL(marker.calendarLink);
          setCalendarHouseKey(url.searchParams.get('house') || '');
        } catch (error) {
          setCalendarHouseKey('');
        }
      } else {
        setCalendarHouseKey('');
      }
    }
  }, [marker]);

  if (!marker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(marker.id, name, calendarHouseKey);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>แก้ไขข้อมูลหมุด</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">พิกัด</label>
            <div className="field-value">
              {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
            </div>
          </div>

          <div className="field">
            <label className="field-label">ชื่อสถานที่</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ใส่ชื่อสถานที่"
              className="field-input"
            />
          </div>

          <div className="field">
            <label className="field-label">ลิงก์ปฏิทิน</label>
            <div className="field-inline">
              <span className="field-prefix">{calendarBaseUrl}</span>
              <input
                type="text"
                value={calendarHouseKey}
                onChange={(e) => setCalendarHouseKey(e.target.value)}
                placeholder="ชื่อบ้านหรือโค้ด"
                className="field-input field-input-inline"
              />
            </div>
            <small className="field-hint">ใส่ชื่อบ้านหรือโค้ดจาก Calendar</small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-danger" onClick={() => onDelete(marker.id)}>
              ลบหมุด
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
