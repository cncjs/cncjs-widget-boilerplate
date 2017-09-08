const pkg = require('./package.json');
const path = require('path');
const webpack = require('webpack');
const findImports = require('find-imports');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const stylusLoader = require('stylus-loader');
const nib = require('nib');

const timestamp = new Date().getTime();
const webpackConfig = {
    entry: {
        index: [
            path.resolve(__dirname, 'src/index.js')
        ]
    },
    output: {
        path: path.join(__dirname, 'dist'),
        chunkFilename: `[name].bundle.js?_=${timestamp}`,
        filename: `[name].bundle.js?_=${timestamp}`
    },
    externals: []
        .concat(Object.keys(pkg.peerDependencies)),
    module: {
        rules: [
            // http://survivejs.com/webpack_react/linting_in_webpack/
            {
                test: /\.jsx?$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                exclude: /node_modules/
            },
            {
                test: /\.styl$/,
                loader: 'stylint-loader',
                enforce: 'pre'
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/
            },
            {
                test: /\.styl$/,
                use: [
                    'style-loader',
                    'css-loader?camelCase&modules&importLoaders=1&localIdentName=[local]---[hash:base64:5]',
                    'stylus-loader'
                ],
                exclude: [
                    path.resolve(__dirname, 'src/styles')
                ]
            },
            {
                test: /\.styl$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'stylus-loader'
                ],
                include: [
                    path.resolve(__dirname, 'src/styles')
                ]
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(png|jpg|svg|cur)$/,
                loader: 'url-loader',
                options: {
                    limit: 8192
                }
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    mimetype: 'application/font-woff'
                }
            },
            {
                test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            }
        ]
    },
    plugins: [],
    resolve: {
        extensions: ['.js', '.jsx']
    }
};

if (process.env.NODE_ENV === 'development') {
    webpackConfig.devtool = 'eval';
    webpackConfig.plugins = [
        new webpack.DefinePlugin({
            'process.env': {
                // This has effect on the react lib size
                NODE_ENV: JSON.stringify('development')
            }
        }),
        new WriteFileWebpackPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new stylusLoader.OptionsPlugin({
            default: {
                // nib - CSS3 extensions for Stylus
                use: [nib()],
                // no need to have a '@import "nib"' in the stylesheet
                import: ['~nib/lib/nib/index.styl']
            }
        }),
        new HtmlWebpackPlugin({
            filename: path.join(__dirname, 'dist/index.html'),
            template: path.join(__dirname, 'assets/index.html')
        })
    ];
} else {
    webpackConfig.devtool = 'source-map';
    webpackConfig.plugins = [
        new webpack.DefinePlugin({
            'process.env': {
                // This has effect on the react lib size
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new stylusLoader.OptionsPlugin({
            default: {
                // nib - CSS3 extensions for Stylus
                use: [nib()],
                // no need to have a '@import "nib"' in the stylesheet
                import: ['~nib/lib/nib/index.styl']
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                screw_ie8: true, // React doesn't support IE8
                warnings: false
            },
            mangle: {
                screw_ie8: true
            },
            output: {
                comments: false,
                screw_ie8: true
            }
        }),
        new HtmlWebpackPlugin({
            filename: path.join(__dirname, 'dist/index.html'),
            template: path.join(__dirname, 'assets/index.html')
        })
    ];
}

module.exports = webpackConfig;
