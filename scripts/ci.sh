#!/usr/bin/env bash
set -euo pipefail

echo "==> Backend tests"
npm test

echo "==> Frontend tests"
cd client
CI=true npm test -- --watchAll=false
echo "==> Frontend production build"
CI=true DISABLE_ESLINT_PLUGIN=true npm run build
cd ..

echo "==> CI green"
