#!/bin/sh
set -e

npm run synth:local
npm run bootstrap:local
npm run deploy:local
