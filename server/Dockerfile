FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mcp/package.json apps/mcp/package.json
RUN pnpm install --frozen-lockfile --filter @in-job/server...
COPY server server
RUN pnpm --filter @in-job/server build
RUN pnpm --filter @in-job/server deploy --legacy --prod /prod/server

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /prod/server ./
COPY --from=build /app/server/dist ./dist
RUN mkdir -p /app/logs && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
