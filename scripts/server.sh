#!/usr/bin/env bash

./node_modules/.bin/mkdirp ./backend/build/ ./frontend/build/

build1_cmd="node_modules/.bin/babel -o ./backend/build/server.js ./backend/src/server.js";
build2_cmd="node_modules/.bin/browserify -o ./frontend/build/login.js -e ./frontend/src/login_main.jsx --extension=.jsx -t babelify";

eval "${build1_cmd}";
eval "${build2_cmd}";

node_modules/.bin/nodemon --config nodemon.json --watch backend/src/ --exec "${build1_cmd}" &

node_modules/.bin/nodemon --config nodemon.json --watch frontend/ --ignore 'frontend/build/*.js' --exec "${build2_cmd}" &

node_modules/.bin/nodemon --config nodemon_server.json --watch backend/build/ ./backend/build/server.js