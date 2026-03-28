#!/bin/sh

echo "Starting WebSocket server..."
bun run server/ws.ts &

echo "Starting Next.js production server..."
node server.js &

# Wait for any process to exit
wait -n
exit $?
