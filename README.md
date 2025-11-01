# Data Scraping Application

A full-stack application for managing contacts, leads, and phone validation with Docker support.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                                                         │
│  ┌────────────────┐           ┌────────────────┐      │
│  │   Frontend     │──────────▶│    Backend     │      │
│  │   (Next.js)    │   API     │   (Express)    │      │
│  │   Port: 3000   │           │   Port: 8000   │      │
│  └────────────────┘           └────────┬───────┘      │
│                                        │              │
│                                 ┌──────▼──────┐       │
│                                 │  MongoDB    │       │
│                                 │ Port: 27017 │       │
│                                 └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running

### Run the Application

```bash
# Clone and navigate to project
cd "Data Scraping"

# Start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/health

### Stop Services

```bash
docker-compose down
```

For complete Docker documentation, see [DOCKER.md](./DOCKER.md)

## 📁 Project Structure

```
Data Scraping/
├── docker-compose.yml          # Main Docker orchestration
├── QUICKSTART.md               # Quick start guide
├── DOCKER.md                   # Comprehensive Docker docs
├── DOCKER_SETUP_SUMMARY.md     # Setup summary
├── .dockerignore               # Root Docker ignore
│
├── ds-backend/                 # Backend API
│   ├── Dockerfile              # Backend Docker image
│   ├── .dockerignore           # Backend ignore patterns
│   ├── package.json
│   └── src/
│       ├── controllers/        # Request handlers
│       ├── database/           # MongoDB connection
│       ├── middleware/         # Auth, upload
│       ├── models/             # Data models
│       ├── repository/         # Data access layer
│       ├── routes/             # API routes
│       ├── services/           # Business logic
│       └── index.ts            # Entry point
│
└── ds-frontend/                # Frontend App
    ├── Dockerfile              # Frontend Docker image
    ├── .dockerignore           # Frontend ignore patterns
    ├── next.config.js          # Next.js config
    ├── package.json
    ├── app/                    # Next.js app directory
    ├── components/             # React components
    ├── contexts/               # React contexts
    ├── lib/                    # Utilities
    └── views/                  # Page views
```

## 🛠️ Technologies

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Twilio (optional)

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI**: React 18
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Yup
- **Icons**: Tabler Icons

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database**: MongoDB 7.0

## ⚙️ Configuration

### Default MongoDB Credentials
- Username: `admin`
- Password: `password123`
- Database: `data-scraping`

⚠️ **Change these for production!**

### Environment Variables

The application uses environment variables configured in `docker-compose.yml`:

**Backend:**
- `MONGODB_URI` - Auto-configured
- `JWT_SECRET` - JWT signing secret
- `TWILIO_ACCOUNT_SID` - Optional
- `TWILIO_AUTH_TOKEN` - Optional
- `TWILIO_PHONE_NUMBER` - Optional

**Frontend:**
- `NEXT_PUBLIC_API_URL` - API endpoint

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick setup guide
- **[DOCKER.md](./DOCKER.md)** - Complete Docker documentation
- **[DOCKER_SETUP_SUMMARY.md](./DOCKER_SETUP_SUMMARY.md)** - Setup overview

## 🎯 Features

- ✅ User authentication (JWT)
- ✅ Contact management
- ✅ Lead tracking system
- ✅ Phone number validation
- ✅ CSV file upload
- ✅ Docker containerization
- ✅ Health checks
- ✅ Persistent data storage
- ✅ Production-ready configuration

## 🧪 Development

For development without Docker, see [QUICKSTART.md](./QUICKSTART.md#manual-setup-without-docker)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Contacts
- `GET /api/contacts` - Get contacts
- `GET /api/contacts/random` - Get random contact
- `POST /api/contacts/records` - Create user record
- `GET /api/contacts/my-leads` - Get user leads

### Phone Validation
- `POST /api/phone-validation/single` - Validate single number
- `POST /api/phone-validation/bulk` - Validate multiple numbers
- `POST /api/phone-validation/csv` - Validate CSV file

### Health
- `GET /health` - Health check

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS enabled
- Non-root Docker user
- Environment-based secrets

## 📦 Docker Services

1. **mongodb** - Database service
2. **backend** - API service
3. **frontend** - Web application

All services include health checks and automatic restart.

## 🐛 Troubleshooting

See [DOCKER.md](./DOCKER.md#troubleshooting) for common issues and solutions.

## 📄 License

ISC

## 👤 Author

Data Scraping Team

---

**Ready to start?** Check out [QUICKSTART.md](./QUICKSTART.md)!

