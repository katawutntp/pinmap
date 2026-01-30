# 🚀 คู่มือ Deploy บน Vercel และตั้งค่า Firebase

## ขั้นตอนที่ 1: ตั้งค่า Firebase (ฟรี ไม่ต้องใช้บัตร)

### 1.1 สร้างโปรเจค Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Add project" หรือ "สร้างโปรเจค"
3. ตั้งชื่อโปรเจค เช่น "pinmap"
4. ปิด Google Analytics (ไม่จำเป็น)
5. คลิก "Create project"

### 1.2 เปิดใช้งาน Firestore Database

1. ในเมนูด้านซ้าย คลิก "Firestore Database"
2. คลิก "Create database"
3. เลือก **"Start in production mode"**
4. เลือก location: `asia-southeast1` (สิงคโปร์) หรือใกล้คุณที่สุด
5. คลิก "Enable"

### 1.3 ตั้งค่า Security Rules

ในหน้า Firestore → Rules → แก้ไขเป็น:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /markers/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

คลิก "Publish"

### 1.4 สร้าง Web App และดึง Config

1. ที่หน้าแรกของโปรเจค คลิกไอคอน **</>** (Web)
2. ตั้งชื่อ App: "pinmap-web"
3. **ไม่ต้องติ๊ก** Firebase Hosting
4. คลิก "Register app"
5. **คัดลอกค่า config** ทั้งหมด:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "pinmap-xxxxx.firebaseapp.com",
  projectId: "pinmap-xxxxx",
  storageBucket: "pinmap-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

---

## ขั้นตอนที่ 2: อัปโหลดโค้ดไปยัง GitHub

### 2.1 สร้าง Repository บน GitHub

1. ไปที่ [GitHub](https://github.com/)
2. คลิก "+" → "New repository"
3. ตั้งชื่อ: `pinmap`
4. เลือก **Public** หรือ **Private**
5. **ไม่ต้อง** ติ๊ก README, .gitignore, license
6. คลิก "Create repository"

### 2.2 Push โค้ดขึ้น GitHub

เปิด Terminal ในโฟลเดอร์โปรเจค:

```bash
git remote add origin https://github.com/katawutntp/pinmap.git
git branch -M main
git push -u origin main
```

---

## ขั้นตอนที่ 3: Deploy บน Vercel

### 3.1 Import Project

1. ไปที่ [Vercel](https://vercel.com/)
2. คลิก "Add New" → "Project"
3. Import GitHub repository ที่สร้างไว้
4. Framework Preset: **Vite** (ตรวจจับอัตโนมัติ)

### 3.2 ตั้งค่า Environment Variables

ก่อนกด Deploy คลิก **"Environment Variables"**:

เพิ่มตัวแปรเหล่านี้ (จากค่า Firebase Config):

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pinmap-xxxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `pinmap-xxxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pinmap-xxxxx.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc...` |

### 3.3 Deploy

1. กด **"Deploy"**
2. รอประมาณ 1-2 นาที
3. เว็บจะพร้อมใช้งานที่ URL: `https://pinmap-xxxxx.vercel.app`

---

## ขั้นตอนที่ 4: ทดสอบ

1. เปิด URL ที่ได้จาก Vercel
2. ลองวางพิกัด: `13.7500, 100.4913`
3. คลิก "เพิ่มตำแหน่ง"
4. ตรวจสอบใน Firebase Console → Firestore Database → markers

---

## 🔄 การอัปเดทโค้ด

เมื่อแก้ไขโค้ด:

```bash
git add .
git commit -m "แก้ไข: ..."
git push
```

Vercel จะ deploy อัตโนมัติทันที!

---

## 🛠️ Troubleshooting

### ❌ Error: "Firebase not configured"
- ตรวจสอบ Environment Variables ใน Vercel
- ตรวจสอบว่าชื่อตัวแปรขึ้นต้นด้วย `VITE_`

### ❌ Error: "Permission denied"
- ตรวจสอบ Firestore Rules ว่าอนุญาต read/write

### ❌ แผนที่ไม่แสดง
- ตรวจสอบ Console (F12) หา error
- ลองรีเฟรชหน้าเว็บ

---

## 📝 หมายเหตุ

- Firebase Free Tier: 50,000 reads/day, 20,000 writes/day
- Vercel Free Tier: Bandwidth 100GB/month
- ไม่มีค่าใช้จ่ายถ้าไม่เกิน Free Tier

---

**สำเร็จ! 🎉** เว็บของคุณพร้อมใช้งานแล้ว
