# Data Scraping Backend

Node.js/TypeScript backend API for data scraping and lead management.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally or update the connection string.

3. Create a `.env` file with MongoDB connection details:

**For MongoDB without authentication (local development):**
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/data-scraping
```

**For MongoDB with authentication:**
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

**Or use individual components:**
```
PORT=3001
NODE_ENV=development
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=data-scraping
```

**For MongoDB Atlas (cloud):**
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/data-scraping?retryWrites=true&w=majority
```

4. Run the development server:
```bash
npm run dev
```

5. The API will be available at `http://localhost:3001`

## API Endpoints

### Contacts

- `GET /api/contacts/random?type={B2B|B2C}&phase={RAW|CLEANED|DELIVERING|DELIVERED}` - Get a random contact
- `POST /api/contacts` - Create a new contact
- `GET /api/contacts?type={B2B|B2C}&phase={phase}&limit={limit}&offset={offset}` - Get contacts with filters
- `PUT /api/contacts/:id/phase` - Update contact phase

### Records

- `POST /api/contacts/records` - Store a user record
- `GET /api/contacts/records/user/:userId` - Get all records for a user

### Health Check

- `GET /health` - Server health check

## Features

- MongoDB database with Mongoose ODM
- Four-phase system: RAW → CLEANED → DELIVERING → DELIVERED
- Automatic phase reset: DELIVERED contacts move back to CLEANED after 3 months
- B2C dummy data seeding
- User record tracking

## Background Jobs

The system includes a scheduled job that runs daily at 2 AM to move DELIVERED contacts back to CLEANED after 3 months.
