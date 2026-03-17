# Getting Started with WargaHub

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **MongoDB** >= 6.0 ([Download](https://www.mongodb.com/try/download/community))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** (for version control)

## Installation

### 1. Install Dependencies

The project uses npm workspaces, so you only need to run install from the root:

```bash
cd "C:\Asep Trisna Setiawan\Logic Frame\Warga HUB"
npm install
```

This will install dependencies for:
- Root workspace
- Backend (apps/backend)
- Frontend (apps/frontend)
- Shared types (packages/shared-types)

**Note:** You may see deprecation warnings - these are expected and do not affect functionality.

### 2. Start MongoDB

Make sure MongoDB is running on `localhost:27017`.

**Option A: MongoDB as Windows Service**
```bash
# If installed as service, MongoDB runs automatically
# Check status in Services app (Win + R → services.msc)
```

**Option B: MongoDB Manually**
```bash
mongod --dbpath "C:\data\db"
```

**Option C: MongoDB with Docker**
```bash
docker run -d -p 27017:27017 --name wargahub-mongo mongo:7
```

### 3. Verify Installation

Check that packages installed correctly:

```bash
# Check backend dependencies
cd apps/backend
npm list --depth=0

# Check frontend dependencies
cd ../frontend
npm list --depth=0

# Return to root
cd ../..
```

## Development

### Start Development Servers

**Option 1: Start Both (Recommended)**
```bash
npm run dev
```

This starts both backend and frontend concurrently.

**Option 2: Start Separately**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/api/v1

### Login (Demo Mode)

Since authentication module is not yet implemented, the login page accepts any credentials:

- **Email:** any@email.com
- **Password:** anypassword

This will be replaced with real authentication in Phase 1.

## Docker Deployment

### Start with Docker

```bash
# Build and start all services
npm run docker:up

# Or manually
cd docker
docker-compose up -d
```

### Access Dockerized App

- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **MongoDB:** localhost:27017

### Stop Docker Services

```bash
npm run docker:down
```

## Project Structure Quick Guide

```
wargahub/
├── apps/
│   ├── backend/          # NestJS API (port 3000)
│   └── frontend/         # React App (port 5173)
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── docker/               # Docker configuration
└── package.json          # Workspace root
```

## Development Workflow

1. **Make Changes**
   - Backend changes auto-reload with `nest start --watch`
   - Frontend changes auto-reload with Vite HMR

2. **Check Logs**
   - Backend logs appear in terminal
   - Frontend logs in browser console

3. **Test API**
   - Use Swagger UI: http://localhost:3000/api/docs
   - Or use Postman/Insomnia

## Common Commands

```bash
# Development
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# Build
npm run build            # Build both
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Rebuild Docker images

# Future commands (after seeders are created)
npm run seed             # Run database seeders
npm run seed:clear       # Clear database
```

## Troubleshooting

### Port Already in Use

**Backend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Frontend (5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### MongoDB Connection Failed

1. Check MongoDB is running:
   ```bash
   # Try connecting
   mongosh
   ```

2. Check connection string in `apps/backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/wargahub
   ```

### Dependencies Installation Failed

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
npm install
```

### Build Errors

```bash
# Backend TypeScript errors
cd apps/backend
npm run build

# Frontend TypeScript errors
cd apps/frontend
npm run build
```

## Environment Variables

### Backend (.env)

Located at: `apps/backend/.env`

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wargahub
JWT_SECRET=wargahub-super-secret-jwt-key-development-only
JWT_REFRESH_SECRET=wargahub-refresh-secret-development-only
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

Located at: `apps/frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=WargaHub
```

## Next Steps

After verifying the foundation works:

1. ✅ Backend starts successfully
2. ✅ Frontend loads in browser
3. ✅ MongoDB connects
4. ✅ Swagger docs accessible
5. ✅ Login page renders
6. ✅ Dashboard loads

**Then proceed to:** Phase 1 - Authentication & RBAC implementation

## Need Help?

- Check `IMPLEMENTATION_STATUS.md` for current progress
- Check `README.md` for project overview
- Review Swagger docs for API endpoints
- Check console/terminal for error messages

---

**Status:** Phase 0 Complete - Foundation Ready
**Next Phase:** Authentication & RBAC (Week 2-3)
