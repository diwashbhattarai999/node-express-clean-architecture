#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running database migrations..."
  node dist/scripts/migrate.js
  echo "Migrations complete."
fi

exec "$@"
