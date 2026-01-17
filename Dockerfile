FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 3002

COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/server.js"]
