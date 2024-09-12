const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv').config({ path: './.env' }); // Loads the .env file

module.exports = {
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
  mode: 'production',
  optimization: {
    minimize: false, // Disable minification
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.parsed),
    }),
  ],
};






