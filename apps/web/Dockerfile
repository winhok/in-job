FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mcp/package.json apps/mcp/package.json
RUN pnpm install --frozen-lockfile --filter @in-job/web...
COPY apps/web apps/web
ARG VITE_API_BASE_URL=/api
ARG NUXT_PUBLIC_OSS_REGION=
ARG NUXT_PUBLIC_OSS_BUCKET=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NUXT_PUBLIC_OSS_REGION=$NUXT_PUBLIC_OSS_REGION
ENV NUXT_PUBLIC_OSS_BUCKET=$NUXT_PUBLIC_OSS_BUCKET
RUN pnpm --filter @in-job/web build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
WORKDIR /app
COPY --from=build /app/apps/web/.output ./
USER node
EXPOSE 8080
CMD ["node", "server/index.mjs"]
