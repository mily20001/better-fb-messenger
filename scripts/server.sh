#!/usr/bin/env bash

node_modules/.bin/nodemon --watch backend/src/ --exec "node_modules/.bin/babel -o ./backend/build/server.js ./backend/src/server.js" &
node_modules/.bin/nodemon --watch backend/build/ ./backend/build/server.js
