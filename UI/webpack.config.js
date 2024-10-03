const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  console.log('Current build mode:', argv.mode); // Log the current build mode
  console.log('Dist directory:', path.resolve(__dirname, 'dist')); // Log the path to the dist directory

  return {
    entry: './src/main.tsx',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: process.env.PUBLIC_PATH || '/',  // Use PUBLIC_PATH environment variable
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
      minimize: false, // Minimize only in production
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








