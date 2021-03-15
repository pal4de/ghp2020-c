var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },

    // module: {
    //     rules: [
    //         {
    //             test: /\.scss$/,
    //             use: [
    //                 'style-loader',
    //                 'css-loader',
    //                 'sass-loader'
    //             ]
    //         },
    //     ]
    // },
    // resolve: {
    //     extensions: ['.js']
    // },

    // plugins: [
    //     new HtmlWebpackPlugin({
    //         template: './src/index.html'
    //     })
    // ]
};