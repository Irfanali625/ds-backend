# 🚀 Quick Start Guide

## Docker Setup (Recommended)

The easiest way to run the entire application stack:

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Open terminal in the project root:**
   ```bash
   cd "Data Scraping"
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```
   
   Or run in background:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Health Check: http://localhost:8000/health

4. **Stop services:**
   ```bash
   docker-compose down
   ```

### What's Running?

- **MongoDB**: Database on port 27017
- **Backend**: Express API on port 8000
- **Frontend**: Next.js app on port 3000

All services communicate through an internal Docker network.

### Default MongoDB Credentials
- Username: `admin`
- Password: `password123`
- Database: `data-scraping`

⚠️ **Change these for production!**

---

## Manual Setup (Without Docker)

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd ds-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env` file:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/data-scraping
   JWT_SECRET=your-secret-key
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_phone_number
   ```

4. **Ensure MongoDB is running locally**

5. **Start backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd ds-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

---

## For More Details

See [DOCKER.md](./DOCKER.md) for comprehensive Docker documentation.

