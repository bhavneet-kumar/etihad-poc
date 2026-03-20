#!/bin/sh
set -eu

# Minimal subset of "serve" CLI used by this project:
# serve -s dist -l 8080 --single

port="3000"

while [ "$#" -gt 0 ]; do
  case "$1" in
    -l|--listen)
      port="${2:-3000}"
      shift 2
      ;;
    *)
      shift 1
      ;;
  esac
done

export PORT="$port"
exec node /app/docker-static-server.mjs

