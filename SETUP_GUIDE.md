# คู่มือการตั้งค่า Google Maps API และ Firebase

## 1. Google Maps API

### ขั้นตอนการสร้าง API Key:

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจคใหม่หรือเลือกโปรเจคที่มีอยู่
3. เปิดใช้งาน Google Maps JavaScript API:
   - ไปที่ "APIs & Services" > "Library"
   - ค้นหา "Maps JavaScript API"
   - คลิก "Enable"
4. สร้าง API Key:
   - ไปที่ "APIs & Services" > "Credentials"
   - คลิก "Create Credentials" > "API Key"
   - คัดลอก API Key
5. (แนะนำ) จำกัดการใช้งาน API Key:
   - คลิกที่ API Key ที่สร้าง
   - ใน "Application restrictions" เลือก "HTTP referrers"
   - เพิ่ม `http://localhost:5173/*` สำหรับการพัฒนา
   - เพิ่ม domain ของคุณสำหรับ production

## 2. Firebase

### ขั้นตอนการตั้งค่า Firebase:

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Add project" เพื่อสร้างโปรเจคใหม่
3. ตั้งชื่อโปรเจค แล้วทำตามขั้นตอน
4. เมื่อโปรเจคสร้างเสร็จ คลิก "Web" (</>) เพื่อเพิ่ม Web App
5. ตั้งชื่อ App และลงทะเบียน
6. คัดลอกค่า config ทั้งหมด:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### เปิดใช้งาน Firestore:

1. ในเมนูด้านซ้าย เลือก "Firestore Database"
2. คลิก "Create database"
3. เลือก "Start in test mode" (สำหรับการพัฒนา)
4. เลือก location ที่ใกล้คุณที่สุด
5. คลิก "Enable"

### เปิดใช้งาน Storage:

1. ในเมนูด้านซ้าย เลือก "Storage"
2. คลิก "Get started"
3. เลือก "Start in test mode" (สำหรับการพัฒนา)
4. คลิก "Next" และ "Done"

### ตั้งค่า Security Rules (สำหรับ Production):

#### Firestore Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /markers/{document=**} {
      allow read: if true;
      allow write: if true; // เปลี่ยนเป็น authentication ในอนาคต
    }
  }
}
```

#### Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /markers/{allPaths=**} {
      allow read: if true;
      allow write: if true; // เปลี่ยนเป็น authentication ในอนาคต
    }
  }
}
```

## 3. การตั้งค่าไฟล์ .env.local

สร้างไฟล์ `.env.local` ในโฟลเดอร์ root ของโปรเจค:

```
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 4. สำหรับการ Deploy บน Vercel

1. ใน Vercel Dashboard ไปที่โปรเจคของคุณ
2. เลือก "Settings" > "Environment Variables"
3. เพิ่มค่าทุกตัวจากไฟล์ `.env.local`
4. อย่าลืมอัพเดท Google Maps API Key restrictions ให้รวม domain ของ Vercel

## หมายเหตุด้านความปลอดภัย

⚠️ **สำคัญ**: การตั้งค่าปัจจุบันอยู่ใน "test mode" ซึ่งอนุญาตให้ทุกคนเข้าถึงข้อมูลได้

สำหรับการใช้งานจริง ควร:
1. เพิ่มระบบ Authentication (Firebase Auth)
2. อัพเดท Security Rules เพื่อจำกัดการเข้าถึง
3. จำกัดการใช้งาน API Keys ตาม domain
4. ตั้งค่า billing alerts ใน Google Cloud
