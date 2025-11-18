# ---------- BUILD STAGE ----------
    FROM node:18 AS builder
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --legacy-peer-deps
    
    COPY . .
    RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build
    
    # ---------- PRODUCTION STAGE ----------
    FROM node:18 AS production
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm ci --only=production --legacy-peer-deps
    
    COPY --from=builder /app/dist ./dist
    
    EXPOSE 8000
    CMD ["npm", "start"]
    