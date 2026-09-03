FROM node:24.6.0-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.base.json eslint.config.mjs vitest.config.ts ./
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
ARG APP=@cg/api
RUN pnpm --filter "$APP" build
CMD ["pnpm","--filter","@cg/api","start"]
