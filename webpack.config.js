var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var webpack = require("webpack");

module.exports = {
    entry: {
        app: 'main.js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                        // plugins: [require('babel-plugin-transform-object-rest-spread')]
                    }
                }
            },
            {
                test: /\.s?css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: 'css-loader?importLoaders=1!resolve-url-loader!postcss-loader?sourceMap!sass-loader'
                })
            }
        ]
    },

    output: {
        path: path.join(__dirname, "./dist"),
        filename: '[name].bundle.js',
    },

    resolve: {
        modules: [path.resolve(__dirname, '.'), 'node_modules']
    },

    plugins: [
        new ExtractTextPlugin("main.css"),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        })
    ],

    /*watchOptions: {
        watch: true
    }*/
};
