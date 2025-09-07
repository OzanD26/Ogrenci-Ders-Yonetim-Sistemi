# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Bağımlılıklar
COPY package*.json ./
RUN npm install

# Prisma şema ve kaynaklar
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Prisma client üret
RUN npx prisma generate

# Geliştirme için port
EXPOSE 4000

# CMD compose içinden geçecek (migrate+seed+dev)
