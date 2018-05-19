var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
    entry: {
        app: path.join(__dirname, 'js', 'main.js')
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [['env', {
                            targets: {
                                browsers: ['last 5 versions', '> 0.5%', 'Firefox ESR']
                            }
                        }]]
                    }
                }
            },
            {
                test: /\.s?css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?importLoaders=1!resolve-url-loader!postcss-loader!sass-loader'
                })
            }
        ]
    },

    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },

    resolve: {
        modules: [path.join(__dirname, 'js'), 'node_modules']
    },

    plugins: [
        new ExtractTextPlugin('main.css'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        // embed all javascript and css inline
        new HtmlWebpackPlugin({
            inlineSource: '.(js|css)$',
            template: 'abirechner.html'
        }),
        new HtmlWebpackInlineSourcePlugin()
    ]
};
