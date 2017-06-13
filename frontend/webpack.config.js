var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './src/login.jsx',
    output: { path: __dirname+'/build/', filename: 'login.js' },
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            }
        ]
    },
};