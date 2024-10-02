const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.tsx',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      modules: [path.resolve(__dirname, 'node_modules')],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    mode: isProduction ? 'production' : 'development',
    optimization: {
      // minimize: isProduction, // Minimize only in production
      minimize: false,
    },
    devtool: isProduction ? false : 'inline-source-map', // Disable source maps in production
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      historyApiFallback: true, // For SPAs, enables serving index.html for 404s
      port: 8080, // Local server port
      hot: true, // Enable Hot Module Replacement
      open: true, // Auto-open in the browser
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode), // Define NODE_ENV for production builds
      }),
    ],
  };
};








