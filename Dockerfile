# ─── Build stage ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
RUN npm run build

# ─── Production stage ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Faqat production dependencylar
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build natijasi
COPY --from=builder /app/dist ./dist

# Uploads papkasi
RUN mkdir -p uploads/students uploads/groups

EXPOSE 3000

CMD ["node", "dist/main"]
