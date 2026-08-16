#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "==> Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js
  echo "==> Migrations completed."
fi

exec "$@"
