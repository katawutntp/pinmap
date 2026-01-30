import { useState } from 'react';

interface LinkInputFormProps {
  onAddLinks: (links: string[]) => void;
}

export const LinkInputForm = ({ onAddLinks }: LinkInputFormProps) => {
  const [linksText, setLinksText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const links = linksText
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0);
    
    if (links.length > 0) {
      onAddLinks(links);
      setLinksText('');
    }
  };

  const exampleLink = 'https://www.google.com/maps/place/Grand+Palace/@13.7500272,100.4913494,17z';

  return (
    <div style={{ marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h2 style={{ marginTop: 0 }}>เพิ่มตำแหน่งจากลิงค์ Google Maps</h2>
      <div style={{ marginBottom: '12px', padding: '12px', background: '#fff3cd', borderRadius: '4px', fontSize: '14px', color: '#856404' }}>
        <strong>📍 วิธีใช้:</strong>
        <ol style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li>เปิด Google Maps → คลิกขวาที่ตำแหน่งที่ต้องการ → คัดลอกพิกัด (ตัวเลข เช่น 13.7500, 100.4913)</li>
          <li>หรือใช้ลิงค์แบบเต็ม เช่น: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>https://www.google.com/maps/place/...</code></li>
          <li>วางพิกัดหรือลิงค์ลงในช่องด้านล่าง (แต่ละบรรทัดสำหรับ 1 ตำแหน่ง)</li>
        </ol>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={linksText}
          onChange={(e) => setLinksText(e.target.value)}
          placeholder={`วางพิกัดหรือลิงค์ Google Maps ที่นี่\n\nตัวอย่างพิกัด:\n13.7500, 100.4913\n\nตัวอย่างลิงค์:\n${exampleLink}`}
          style={{
            width: '100%',
            height: '140px',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <button 
          type="submit"
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          เพิ่มตำแหน่ง
        </button>
      </form>
    </div>
  );
};
