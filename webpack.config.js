var webpack = require("webpack");
var fs = require("fs");
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin")

const buildPath = path.join(__dirname, 'build')
module.exports = {
    devtool: "eval-source-map",
    entry: {
        main: "./main.js"
    },

    output: {
        filename: '[name].bundle.js',
        path: buildPath,
        publicPath: '/public/',
        chunkFilenames: '[id].chunk.js'
    },
    resolve: {
        extension: ['', '.js', '.vue', '.css'],
        alias:{
            'jquery': 'jquery'
        }
    },
    module: {
        loaders: [{
            test: /.js$/,
            exclude: /node_modules/,
            loader: 'babel'
        }, {
            test: /.vue$/,
            loader: 'vue'
        }, {
            test: /.less$/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
        }, {
            test: /.css$/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        }, {
            test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
            loader: 'file-loader'
        }, {
            test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
            loader: 'file-loader',
            query: {
                name: '[name].[ext]?[hash]'
            }
        }
        // ,{
        //     test: require.resolve('jquery'),
        //     loader: 'expose?jquery!expose?$'
        // }
    ]
    },
    vue: {
        loaders: {
            css: ExtractTextPlugin.extract('vue-style-loader', 'css-loader')
        }
    },

    plugins: [
        new webpack.optimize.CommonsChunkPlugin('common.js'),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || "development")
        }),
        // new webpack.ProvidePlugin({
        //     $: "jquery",
        //     jQuery: "jquery",
        //     "window.jQuery": "jquery"
        // }),
        new ExtractTextPlugin('css/style.css', {
            allChunks: true
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()

    ]
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ])
}
