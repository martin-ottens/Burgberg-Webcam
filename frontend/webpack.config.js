const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  performance: {
    hints: false
  },
  module: {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"]
                }
            }
        },
        {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader']
        }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html"
    }),
    new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css'
    }),
    new CopyPlugin({
      patterns: [
        { from: "assets", to: "assets" }
      ]
    })
  ]
};
