#!/usr/bin/env bash

./node_modules/.bin/mkdirp ./backend/build/ ./frontend/build/

build_server_cmd="node_modules/.bin/babel -o ./backend/build/server.js ./backend/src/server.js";

eval "${build_server_cmd}";

node_modules/.bin/nodemon --config ./scripts/nodemon.json --watch backend/src/ --exec "${build_server_cmd}" &

node_modules/.bin/nodemon --config ./scripts/nodemon_server.json --watch backend/build/ ./backend/build/server.js