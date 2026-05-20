#!/bin/bash
echo "Starting Todo PWA dev server..."
echo

if command -v python3 &> /dev/null; then
  echo "Using Python http.server on port 8000"
  echo "Open http://localhost:8000"
  python3 -m http.server 8000
elif command -v python &> /dev/null; then
  echo "Using Python http.server on port 8000"
  echo "Open http://localhost:8000"
  python -m http.server 8000
elif command -v npx &> /dev/null; then
  echo "Using npx serve on port 8000"
  echo "Open http://localhost:8000"
  npx serve . -p 8000
else
  echo "Error: Install Python (https://python.org) or Node.js (https://nodejs.org)"
  exit 1
fi
