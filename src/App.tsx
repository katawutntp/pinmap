import { useState, useEffect, useMemo } from 'react';
import { collection, updateDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MapComponent } from './components/MapComponent';
import { MarkerEditModal } from './components/MarkerEditModal';
import { MarkerList } from './components/MarkerList';
import { extractCoordinates } from './utils/extractCoordinates';
import type { MarkerData } from './types';
import './App.css';

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [houseLookup, setHouseLookup] = useState<Record<string, number>>({});
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedMarkerIds, setFocusedMarkerIds] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [shareToast, setShareToast] = useState(false);
  const calendarBaseUrl = 'https://baanpoolvilla-calendar.vercel.app/?house=';

  // Detect share mode from URL param ?marker=ID
  const sharedMarkerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('marker');
  }, []);
  const isShareMode = !!sharedMarkerId;

  // Load markers from Firebase on mount
  useEffect(() => {
    loadMarkers();
    loadCalendarHouses();
  }, []);

  const normalizeKey = (value?: string | null) => (value || '').toLowerCase().trim();

  const getHouseKeyFromLink = (link?: string | null) => {
    if (!link) return '';
    try {
      const url = new URL(link);
      return url.searchParams.get('house') || '';
    } catch (error) {
      return '';
    }
  };

  const loadCalendarHouses = async () => {
    try {
      const res = await fetch('https://baanpoolvilla-calendar.vercel.app/api/houses');
      if (!res.ok) {
        console.error('Failed to fetch houses:', res.status);
        return;
      }
      const houses = await res.json();
      console.log('📦 Loaded houses from calendar:', houses);
      if (!Array.isArray(houses)) return;

      const lookup: Record<string, number> = {};
      const calendarMarkers: MarkerData[] = [];
      
      houses.forEach((house) => {
        const capacity = typeof house.capacity === 'number' ? house.capacity : parseInt(house.capacity || '0', 10);
        if (house.name) {
          lookup[normalizeKey(house.name)] = capacity || 0;
        }
        if (house.code) {
          lookup[normalizeKey(house.code)] = capacity || 0;
        }
        
        // ถ้ามี location ให้สร้าง marker อัตโนมัติ
        if (house.location) {
          const coords = extractCoordinates(house.location);
          if (coords) {
            const houseKey = house.name || house.code || '';
            const bedrooms = typeof house.bedrooms === 'number' ? house.bedrooms : parseInt(house.bedrooms || '0', 10);
            const bathrooms = typeof house.bathrooms === 'number' ? house.bathrooms : parseInt(house.bathrooms || '0', 10);
            calendarMarkers.push({
              id: `calendar-${house.id}`,
              lat: coords.lat,
              lng: coords.lng,
              name: house.name || '',
              googleMapsLink: house.location,
              calendarLink: houseKey ? `${calendarBaseUrl}${encodeURIComponent(houseKey)}` : '',
              capacity: capacity || 0,
              bedrooms: bedrooms || 0,
              bathrooms: bathrooms || 0,
              zone: house.zone || '',
            });
          }
        }
      });
      
      console.log('📋 Final lookup table:', lookup);
      console.log('🏠 Calendar markers:', calendarMarkers);
      setHouseLookup(lookup);
      
      // รวม markers จาก Calendar กับ markers จาก Firebase
      setMarkers(prev => {
        // กรอง markers จาก Calendar เก่าออก แล้วเพิ่มใหม่
        const firebaseMarkers = prev.filter(m => !m.id.startsWith('calendar-'));
        return [...firebaseMarkers, ...calendarMarkers];
      });
    } catch (error) {
      console.error('Error loading calendar houses:', error);
    }
  };

  const loadMarkers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'markers'));
      const loadedMarkers: MarkerData[] = [];
      querySnapshot.forEach((doc) => {
        loadedMarkers.push({ id: doc.id, ...doc.data() } as MarkerData);
      });
      setMarkers(loadedMarkers);
      setError(null);
    } catch (error) {
      console.error('Error loading markers:', error);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการตั้งค่า Firebase');
    } finally {
      setLoading(false);
    }
  };

  // Save marker data
  const handleSaveMarker = async (id: string, name: string, calendarHouseKey: string) => {
    setLoading(true);
    try {
      const trimmedKey = calendarHouseKey.trim();
      const calendarLink = trimmedKey ? `${calendarBaseUrl}${encodeURIComponent(trimmedKey)}` : '';
      const markerRef = doc(db, 'markers', id);
      await updateDoc(markerRef, { name, calendarLink });

      setMarkers(prev => prev.map(marker => 
        marker.id === id 
          ? { ...marker, name, calendarLink }
          : marker
      ));
      setSelectedMarker(null);
      setFocusedMarkerIds(prev => prev.includes(id) ? prev : [...prev, id]);
    } catch (error) {
      console.error('Error saving marker:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a marker
  const handleDeleteMarker = async (id: string) => {
    if (confirm('ต้องการลบหมุดนี้หรือไม่?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'markers', id));
        setMarkers(prev => prev.filter(marker => marker.id !== id));
        setSelectedMarker(null);
      } catch (error) {
        console.error('Error deleting marker:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Share a marker — copy shareable link to clipboard
  const handleShareMarker = async (markerId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?marker=${encodeURIComponent(markerId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  // In share mode, show only the shared marker
  const displayMarkers = useMemo(() => {
    if (isShareMode && sharedMarkerId) {
      const found = markers.find(m => m.id === sharedMarkerId);
      return found ? [found] : [];
    }
    return markers;
  }, [markers, isShareMode, sharedMarkerId]);

  // Auto-focus shared marker
  useEffect(() => {
    if (isShareMode && sharedMarkerId && markers.length > 0) {
      const found = markers.find(m => m.id === sharedMarkerId);
      if (found) {
        setFocusedMarkerIds([sharedMarkerId]);
      }
    }
  }, [isShareMode, sharedMarkerId, markers]);

  // Enrich markers with capacity from lookup
  const enrichMarker = (marker: MarkerData) => {
    const key = getHouseKeyFromLink(marker.calendarLink) || marker.name || '';
    const capacity = houseLookup[normalizeKey(key)] ?? houseLookup[normalizeKey(marker.name || '')];
    return { ...marker, capacity };
  };

  const filteredMarkers = displayMarkers
    .filter(m => isShareMode || selectedZone === 'all' || m.zone === selectedZone)
    .map(enrichMarker);

  // === SHARE MODE: simplified view for customers ===
  if (isShareMode) {
    const sharedMarker = filteredMarkers[0];
    return (
      <div className="app share-mode">
        <header className="app-header share-header">
          <div className="brand">
            <span className="brand-icon">🗺️</span>
            <div>
              <h1>{sharedMarker?.name || 'ตำแหน่งบ้านพัก'}</h1>
              <p className="subtitle">BaanPoolVilla</p>
            </div>
          </div>
          {sharedMarker && (
            <div className="share-info-badges">
              {typeof sharedMarker.capacity === 'number' && sharedMarker.capacity > 0 && (
                <span className="share-badge">👥 {sharedMarker.capacity} คน</span>
              )}
              {typeof sharedMarker.bedrooms === 'number' && sharedMarker.bedrooms > 0 && (
                <span className="share-badge">🛏️ {sharedMarker.bedrooms} ห้องนอน</span>
              )}
              {typeof sharedMarker.bathrooms === 'number' && sharedMarker.bathrooms > 0 && (
                <span className="share-badge">🚿 {sharedMarker.bathrooms} ห้องน้ำ</span>
              )}
              {sharedMarker.zone && (
                <span className="share-badge zone">
                  {sharedMarker.zone === 'pattaya' ? '🏖️ พัทยา' :
                   sharedMarker.zone === 'bangsaen' ? '🌊 บางแสน' :
                   sharedMarker.zone === 'sattahip' ? '⚓ สัตหีบ' :
                   sharedMarker.zone === 'rayong' ? '🏝️ ระยอง' : ''}
                </span>
              )}
            </div>
          )}
        </header>

        {!sharedMarker && !loading && (
          <div className="alert error">ไม่พบข้อมูลหมุดนี้</div>
        )}

        <div className="content">
          {loading && <div className="loading">กำลังโหลด...</div>}
          <div className="map-layout share-map-layout">
            <MapComponent
              markers={filteredMarkers}
              onMarkerFocus={() => {}}
              focusedMarkerIds={focusedMarkerIds}
              selectedZone="all"
              isShareMode={true}
            />
          </div>
          {sharedMarker?.googleMapsLink && (
            <div className="share-navigate">
              <a
                href={sharedMarker.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-navigate"
              >
                🧭 นำทางด้วย Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // === NORMAL MODE: full admin/staff view ===
  return (
    <div className="app">
      {shareToast && (
        <div className="share-toast">✅ คัดลอกลิงก์แชร์แล้ว!</div>
      )}

      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">🗺️</span>
          <div>
            <h1>แผนที่ปักหมุด</h1>
            <p className="subtitle">แผนที่บ้านพูลวิลล่า BaanPoolVilla</p>
          </div>
        </div>
        <div className="header-controls">
          <div className="zone-filter">
            <label>โซน:</label>
            <select 
              value={selectedZone} 
              onChange={(e) => setSelectedZone(e.target.value)}
              className="zone-select"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pattaya">🏖️ พัทยา</option>
              <option value="bangsaen">🌊 บางแสน</option>
              <option value="sattahip">⚓ สัตหีบ</option>
              <option value="rayong">🏝️ ระยอง</option>
            </select>
          </div>
          <div className="stat-card">
            <span className="stat-label">จำนวนหมุด</span>
            <span className="stat-value">{filteredMarkers.length}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="content">
        {loading && (
          <div className="loading">กำลังโหลด...</div>
        )}

        <div className="map-layout">
          <MarkerList
            markers={filteredMarkers}
            onSelect={(marker) => setFocusedMarkerIds(prev => 
              prev.includes(marker.id) 
                ? prev.filter(id => id !== marker.id) 
                : [...prev, marker.id]
            )}
            onEdit={setSelectedMarker}
            onShare={handleShareMarker}
            focusedMarkerIds={focusedMarkerIds}
            selectedZone={selectedZone}
          />
          <MapComponent 
            markers={filteredMarkers}
            onMarkerFocus={(markerId) => setFocusedMarkerIds(prev => 
              prev.includes(markerId) 
                ? prev.filter(id => id !== markerId) 
                : [...prev, markerId]
            )}
            onShareMarker={handleShareMarker}
            focusedMarkerIds={focusedMarkerIds}
            selectedZone={selectedZone}
          />
        </div>
      </div>

      <MarkerEditModal
        marker={selectedMarker}
        onSave={handleSaveMarker}
        onDelete={handleDeleteMarker}
        onClose={() => setSelectedMarker(null)}
      />
    </div>
  );
}

export default App;
