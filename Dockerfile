FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json && npm prune --omit=dev

COPY views ./views
COPY public ./public

ENV NODE_ENV=production
ENV MODE=production
ENV DATA_DIR=/var/data

CMD ["node", "dist/server.js"]
