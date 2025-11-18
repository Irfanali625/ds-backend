# Backend Dockerfile
FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]

