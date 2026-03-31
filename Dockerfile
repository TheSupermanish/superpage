# SuperPage Production Dockerfile
# Frontend is pre-built locally and copied in

FROM node:22-slim
RUN npm install -g pnpm tsx pm2
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
COPY packages/x402-sdk-eth/package.json packages/x402-sdk-eth/
COPY packages/contracts/package.json packages/contracts/
COPY packages/mcp-client/package.json packages/mcp-client/
COPY packages/ai-agent/package.json packages/ai-agent/

# Install deps (production)
RUN pnpm install --no-frozen-lockfile

# Copy all source
COPY . .

# Build SDK only (frontend is pre-built)
RUN cd packages/x402-sdk-eth && npx tsup src/index.ts --format cjs,esm --dts

EXPOSE 1337 3000

# PM2 ecosystem
RUN echo '{"apps":[{"name":"backend","script":"packages/backend/src/index.ts","interpreter":"tsx","env":{"NODE_ENV":"production"}},{"name":"frontend","script":"node_modules/.bin/next","args":"start -p 3000","cwd":"packages/frontend","env":{"NODE_ENV":"production"}}]}' > ecosystem.config.json

CMD ["pm2-runtime", "ecosystem.config.json"]
