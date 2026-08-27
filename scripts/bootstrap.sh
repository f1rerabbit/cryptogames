#!/usr/bin/env sh
set -eu
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
printf '%s\n' 'Bootstrap complete. Copy .env.example to .env before migrate/seed.'
