# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src

EXPOSE 5173

# Vite dev server'ı container dışında erişilebilir yapmak için --host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
