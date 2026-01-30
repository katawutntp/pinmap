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
    <div className="card form-card">
      <div className="form-header">
        <div>
          <h2>เพิ่มตำแหน่ง</h2>
          <p className="help">รองรับพิกัดตรงหรือ URL แบบเต็มจาก Google Maps</p>
        </div>
        <div className="pill">ใหม่</div>
      </div>

      <div className="tips">
        <strong>วิธีเร็ว:</strong> คลิกขวาบน Google Maps → คัดลอกพิกัด → วางที่นี่
      </div>

      <form onSubmit={handleSubmit} className="form">
        <textarea
          value={linksText}
          onChange={(e) => setLinksText(e.target.value)}
          placeholder={`ตัวอย่างพิกัด: 13.7500, 100.4913\nตัวอย่างลิงก์: ${exampleLink}`}
          className="textarea"
        />
        <div className="form-actions">
          <span className="help">แต่ละบรรทัด = 1 หมุด</span>
          <button type="submit" className="btn btn-primary">
            เพิ่มตำแหน่ง
          </button>
        </div>
      </form>
    </div>
  );
};
