FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api --omit=dev
COPY prisma ./prisma
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
