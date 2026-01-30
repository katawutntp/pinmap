# Pin Map Application

แอปพลิเคชันแผนที่ปักหมุดจากลิงค์ Google Maps พร้อมระบบจัดการข้อมูลหมุดและรูปภาพ

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
npm install
```

2. สร้างไฟล์ `.env.local` และใส่ API Keys:
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## การรัน

```bash
npm run dev
```

## ฟีเจอร์

- ✅ เพิ่มหมุดจากลิงค์ Google Maps (รองรับหลายลิงค์พร้อมกัน)
- ✅ คลิกหมุดเพื่อแก้ไขชื่อและรูปภาพ
- ✅ เก็บข้อมูลใน Firebase Firestore
- ✅ อัพโหลดรูปภาพไปยัง Firebase Storage
- ✅ แสดงข้อมูลหมุดบนแผนที่

## วิธีใช้งาน

1. วางลิงค์ Google Maps ในช่อง textarea (แต่ละลิงค์ขึ้นบรรทัดใหม่)
2. กดปุ่ม "เพิ่มตำแหน่ง"
3. คลิกที่หมุดบนแผนที่
4. กดปุ่ม "แก้ไขข้อมูล" เพื่อเพิ่มชื่อและรูปภาพ
5. บันทึกข้อมูล

## การ Deploy ไปยัง Vercel

```bash
npm run build
```

จากนั้นอัพโหลดโปรเจคไปยัง Vercel และตั้งค่า Environment Variables
