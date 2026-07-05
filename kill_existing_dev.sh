#!/usr/bin/env bash
# kill_existing_dev.sh
# Terminates any process listening on ports 3000 or 3001 (commonly used by Next.js dev server)

if command -v lsof > /dev/null; then
  PORTS=(3000 3001)
  for p in "${PORTS[@]}"; do
    PID=$(lsof -ti tcp:${p})
    if [ -n "$PID" ]; then
      echo "Killing process $PID on port $p"
      kill -9 $PID
    fi
  done
else
  echo "lsof not found; attempting to kill node processes"
  pkill -f "next dev"
fi
