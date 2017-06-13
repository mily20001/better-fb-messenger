#!/usr/bin/env bash

build_frontend_cmd="node_modules/.bin/browserify -o ./frontend/build/login.js -e ./frontend/src/login_main.jsx --extension=.jsx -t babelify";

eval "${build_frontend_cmd}";

node_modules/.bin/nodemon --config ./scripts/nodemon_frontend.json --watch 'frontend/' -e js,html,jsx --ignore 'frontend/build/*.js' --exec "${build_frontend_cmd}"