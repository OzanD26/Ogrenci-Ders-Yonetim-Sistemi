# 🎓 Student Course Management App

Bu proje, öğrencilerin derslere kayıt olabileceği ve yöneticilerin öğrenci/ders/kayıt yönetimi yapabileceği **full-stack bir uygulamadır**.  
Frontend kısmı **React (Vite + TypeScript)** ile, backend kısmı ise **Node.js (Express) + Prisma + PostgreSQL** ile geliştirilmiştir.  

---

## 🚀 Özellikler
- 👩‍🎓 **Öğrenci Girişi & Kaydı**
- 🧑‍💼 **Admin Paneli** (Öğrenci/Ders/Kayıt yönetimi)
- 📚 **Derslere kayıt olma, silme**
- 🔐 **JWT tabanlı kimlik doğrulama**
- 🗄 **PostgreSQL + Prisma ORM**
- 🐳 **Docker Compose** ile kolay kurulum

---

## 📂 Proje Yapısı

```
student-course-app/
├── frontend/          # React (Vite) projesi
│   ├── src/
│   │   ├── api/       # Axios client
│   │   ├── components/
│   │   ├── pages/     # Sayfalar (Students, Courses, Enrollments, Login/Register vb.)
│   │   ├── lib/       # auth yardımcıları
│   │   └── App.tsx
│   └── vite.config.ts
│
├── backend/           # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── package.json
```

---

## ⚙️ Gereksinimler
- [Node.js](https://nodejs.org/) (>= 18)  
- [Docker](https://www.docker.com/)  
- [npm](https://www.npmjs.com/) veya [yarn]/[pnpm]  

---

## 🐳 Docker ile Çalıştırma

Projeyi başlatmak için kök klasörde şu komutu çalıştırın:

```bash
docker compose down
docker compose up --build
```

- Backend API → [http://localhost:5174](http://localhost:5174)  
- Frontend → [http://localhost:5173](http://localhost:5173)  
- PostgreSQL DB → `localhost:5432`

---

## 🛠 Geliştirme Ortamı

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

---

## 📊 Prisma & Database

İlk çalıştırmada veritabanını migrate edin:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

---

## 👤 Varsayılan Hesaplar (Seed)

**Admin:**
- Email: `admin@example.com`
- Şifre: `Admin123!`
**Öğrenci:**
  - Email: `deneme@gmail.com`
  - - Şifre: `deneme1`

---

## 🏗 Mimari Tercihler
- **Frontend:** React (Vite), TypeScript, React Router DOM, Axios  
- **Backend:** Express.js, Prisma ORM, JWT Authentication  
- **Veritabanı:** PostgreSQL (Docker üzerinden)  
- **ORM:** Prisma – migration ve type güvenliği için  
- **Auth:** JWT tabanlı, role-based access (ADMIN/STUDENT)  
- **Deploy:** Docker Compose ile servisler (frontend + backend + db)  

---

## 🔑 Ortam Değişkenleri

### Backend (`/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/scdb?schema=public"
JWT_SECRET="super-secret-key"
PORT=5174
```

### Frontend (`/frontend/.env`)
```env
VITE_API_URL="http://localhost:5174"
```

---

## 📜 Lisans
MIT Lisansı ile sunulmuştur.
