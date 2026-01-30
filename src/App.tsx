import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MapComponent } from './components/MapComponent';
import { LinkInputForm } from './components/LinkInputForm';
import { MarkerEditModal } from './components/MarkerEditModal';
import { extractCoordinates } from './utils/extractCoordinates';
import type { MarkerData } from './types';
import './App.css';

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load markers from Firebase on mount
  useEffect(() => {
    loadMarkers();
  }, []);

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

  // Add markers from Google Maps links
  const handleAddLinks = async (links: string[]) => {
    setLoading(true);
    const newMarkers: MarkerData[] = [];

    for (const link of links) {
      const coords = extractCoordinates(link);
      if (coords) {
        try {
          const docRef = await addDoc(collection(db, 'markers'), {
            lat: coords.lat,
            lng: coords.lng,
            googleMapsLink: link,
            name: '',
          });
          
          newMarkers.push({
            id: docRef.id,
            lat: coords.lat,
            lng: coords.lng,
            googleMapsLink: link,
            name: '',
          });
        } catch (error) {
          console.error('Error adding marker:', error);
          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error);
        }
      } else {
        alert('❌ ไม่สามารถดึงพิกัดได้\n\nกรุณาใช้:\n1. พิกัดโดยตรง เช่น: 13.7500, 100.4913\n2. ลิงค์แบบเต็มจาก Google Maps\n\n⚠️ ลิงค์แบบสั้น (goo.gl) ไม่รองรับ');
      }
    }

    if (newMarkers.length > 0) {
      setMarkers(prev => [...prev, ...newMarkers]);
    }
    setLoading(false);
  };

  // Save marker data
  const handleSaveMarker = async (id: string, name: string) => {
    setLoading(true);
    try {
      const markerRef = doc(db, 'markers', id);
      await updateDoc(markerRef, { name });

      setMarkers(prev => prev.map(marker => 
        marker.id === id 
          ? { ...marker, name }
          : marker
      ));
      setSelectedMarker(null);
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        🗺️ แผนที่ปักหมุด
      </h1>

      {error && (
        <div style={{ padding: '15px', marginBottom: '20px', background: '#fee', borderRadius: '4px', color: '#c00', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <LinkInputForm onAddLinks={handleAddLinks} />

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>กำลังโหลด...</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <p style={{ textAlign: 'center', color: '#666' }}>
          จำนวนหมุดทั้งหมด: {markers.length} หมุด
        </p>
      </div>

      <MapComponent 
        markers={markers} 
        onMarkerClick={setSelectedMarker}
      />

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
