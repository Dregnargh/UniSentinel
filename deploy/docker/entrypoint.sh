#!/bin/sh
# UniSentinel container entrypoint.
#   web       -> apply migrations (advisory-locked), then start the web server
#   worker    -> start the job worker (expects web/migrate to have run)
#   migrate   -> apply migrations and exit
#   seed-demo -> populate a FRESH instance with demo data (staging/trials)
set -e

case "$1" in
  web)
    node /app/migrate.cjs /app/migrations
    exec node /app/apps/grc/server.js
    ;;
  worker)
    exec node /app/worker.cjs
    ;;
  migrate)
    exec node /app/migrate.cjs /app/migrations
    ;;
  seed-demo)
    node /app/migrate.cjs /app/migrations
    exec node /app/seed-demo.cjs
    ;;
  *)
    exec "$@"
    ;;
esac
