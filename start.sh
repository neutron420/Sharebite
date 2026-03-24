#!/bin/sh

echo "Starting WebSocket server..."
bun run server/ws.ts &

echo "Starting Next.js main server..."
bun run dev &

# Wait for any process to exit
wait -n
exit $?
