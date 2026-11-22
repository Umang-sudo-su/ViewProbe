FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/mcp-server.js"]
