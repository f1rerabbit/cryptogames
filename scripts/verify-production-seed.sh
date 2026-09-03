#!/usr/bin/env sh
set -u
output="$(NODE_ENV=production pnpm seed 2>&1)"
status=$?
printf '%s\n' "$output"
if [ "$status" -eq 0 ]; then
  echo "production seed unexpectedly succeeded" >&2
  exit 1
fi
printf '%s\n' "$output" | grep -Fq "Seed is disabled outside development/test" || {
  echo "production seed failed for an unrelated reason" >&2
  exit 1
}
echo "production seed rejected by mode policy"
