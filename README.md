# WargaHub - Platform Digital RT/RW/Desa

Platform digital komprehensif untuk digitalisasi layanan administrasi RT/RW/Desa di Indonesia.

## 🚀 Features

- **Manajemen Warga & Keluarga** - Data warga, kartu keluarga, pencarian NIK
- **Surat Menyurat** - Template dinamis, workflow approval RT→RW→Desa, PDF generator
- **Keuangan** - Iuran warga, pencatatan pembayaran, laporan keuangan
- **Keamanan (Ronda)** - Jadwal patroli, QR code checkpoint, GPS tracking
- **Pengumuman** - Broadcast pengumuman dengan target RT/RW/Desa
- **Laporan Lingkungan** - Pelaporan masalah dengan foto & GPS
- **Buku Tamu** - Pencatatan tamu digital
- **Event & Kegiatan** - Manajemen acara dan registrasi peserta
- **Panic Button** - Tombol darurat dengan GPS location
- **Dashboard & Statistik** - Visualisasi data komprehensif
- **RBAC** - 15 role berbeda (SuperAdmin, KepalaDesa, KetuaRW, KetuaRT, dll)

## 🛠️ Tech Stack

**Backend:**
- NestJS (TypeScript)
- MongoDB + Mongoose (UUID v4)
- JWT Authentication
- Multer (file upload)
- Puppeteer (PDF generation)

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)
- React Hook Form + Zod
- React Router

## 📁 Project Structure

```
wargahub/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # React + Vite
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker/               # Docker configuration
├── package.json          # Workspace root
└── README.md
```

## 🚦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Start MongoDB (if not using Docker)
# Make sure MongoDB is running on localhost:27017

# Run seeders
npm run seed

# Start development servers
npm run dev
```

Backend akan berjalan di: http://localhost:3000
Frontend akan berjalan di: http://localhost:5173

### Docker Setup

```bash
# Build and start all services
npm run docker:up

# Stop all services
npm run docker:down
```

## 📝 Development

### Backend Development

```bash
cd apps/backend
npm run start:dev
```

API dokumentasi (Swagger): http://localhost:3000/api/docs

### Frontend Development

```bash
cd apps/frontend
npm run dev
```

## 🗄️ Database

WargaHub menggunakan MongoDB dengan **UUID v4** sebagai primary key (bukan ObjectId).

### Seeders

```bash
# Run all seeders
npm run seed

# Clear database
npm run seed:clear
```

Seeder akan membuat:
- User untuk semua 15 role
- 50+ data warga
- 20+ kartu keluarga
- Template surat
- Sample data untuk semua modul

### Collections (18)

1. users
2. citizens
3. families
4. letter_templates
5. letters
6. payments
7. expenses
8. patrol_schedules
9. patrol_checkpoints
10. patrol_logs
11. announcements
12. reports
13. guestbook
14. events
15. panic_logs
16. notifications
17. audit_logs
18. settings

## 🔐 Authentication

### Default Accounts (setelah seed)

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | superadmin@wargahub.id | Admin123! |
| KepalaDesa | kepaladesa@wargahub.id | Admin123! |
| KetuaRW | ketuarw@wargahub.id | Admin123! |
| KetuaRT | ketuart@wargahub.id | Admin123! |
| Warga | warga@wargahub.id | Warga123! |

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd apps/frontend
npm run test
```

## 📦 Build

```bash
# Build all
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

## 🚢 Deployment

### Docker Production

```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start production
docker-compose -f docker/docker-compose.yml up -d
```

## 📚 Documentation

Lihat folder `docs/` untuk dokumentasi lengkap:
- API Design
- Database Schema
- Features Breakdown
- Tech Stack Details

## 🤝 Contributing

Proyek ini dikembangkan sebagai platform internal. Untuk kontribusi, silakan hubungi tim development.

## 📄 License

MIT License - Copyright (c) 2024 WargaHub

## 🆘 Support

Untuk bantuan dan dukungan:
- Email: support@wargahub.id
- Documentation: `/docs`

---

**Status:** ✅ Phase 0 - Foundation Setup Complete
**Version:** 1.0.0
**Last Updated:** 2026-03-15
