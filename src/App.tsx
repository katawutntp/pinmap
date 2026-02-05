import { useState, useEffect } from 'react';
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
  const [focusMarkerId, setFocusMarkerId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const calendarBaseUrl = 'https://baanpoolvilla-calendar.vercel.app/?house=';

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
      setFocusMarkerId(id);
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

  return (
    <div className="app">
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
            </select>
          </div>
          <div className="stat-card">
            <span className="stat-label">จำนวนหมุด</span>
            <span className="stat-value">{markers.filter(m => selectedZone === 'all' || m.zone === selectedZone).length}</span>
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
            markers={markers
              .filter(m => selectedZone === 'all' || m.zone === selectedZone)
              .map(marker => {
                const key = getHouseKeyFromLink(marker.calendarLink) || marker.name || '';
                const capacity = houseLookup[normalizeKey(key)] ?? houseLookup[normalizeKey(marker.name || '')];
                return { ...marker, capacity };
              })}
            onSelect={(marker) => setFocusMarkerId(marker.id)}
            onEdit={setSelectedMarker}
            focusMarkerId={focusMarkerId}
            selectedZone={selectedZone}
          />
          <MapComponent 
            markers={markers
              .filter(m => selectedZone === 'all' || m.zone === selectedZone)
              .map(marker => {
                const key = getHouseKeyFromLink(marker.calendarLink) || marker.name || '';
                const capacity = houseLookup[normalizeKey(key)] ?? houseLookup[normalizeKey(marker.name || '')];
                return { ...marker, capacity };
              })} 
            onMarkerClick={setSelectedMarker}
            focusMarkerId={focusMarkerId}
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
