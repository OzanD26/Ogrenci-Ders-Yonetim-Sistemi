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

student-course-app/
├── frontend/ # React (Vite) projesi
│ ├── src/
│ │ ├── api/ # Axios client
│ │ ├── components/
│ │ ├── pages/ # Sayfalar (Students, Courses, Enrollments, Login/Register vb.)
│ │ ├── lib/ # auth yardımcıları
│ │ └── App.tsx
│ └── vite.config.ts
│
├── backend/ # Express + Prisma API
│ ├── prisma/
│ │ ├── schema.prisma
│ │ └── migrations/
│ ├── src/
│ │ ├── routes.ts
│ │ ├── controllers/
│ │ ├── services/
│ │ └── middleware/
│ └── Dockerfile
│
├── docker-compose.yml
├── README.md
└── package.json

## ⚙️ Gereksinimler
- [Node.js](https://nodejs.org/) (>= 18)
- [Docker](https://www.docker.com/)
- [npm](https://www.npmjs.com/) veya [yarn]/[pnpm]

- ### Backend (`/backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/scdb?schema=public"
JWT_SECRET="super-secret-key"
PORT=5174

### Frontend (`/frontend/.env`)
VITE_API_URL="http://localhost:5174"

