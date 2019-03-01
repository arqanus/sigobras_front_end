const HtmlWebPackPlugin = require("html-webpack-plugin");
const PORT = process.env.PORT || '80';
var path = require('path');

module.exports = {
  mode: 'production',
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [{
          loader: "html-loader"
        }]
      },
      {
        test: /\.css$/,
        use: [{
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: /\.(svg|png|jpg|jpeg|gif)$/,
        use: [{
          loader: "file-loader",
          options: {
            name: '[path][name].[ext]',
            outputPath: 'images'
          }
        }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: 'main.js',
    publicPath: '/',
  },
  devServer: {
    host: "0.0.0.0",
    contentBase: path.join(__dirname, "public"),
    compress: true,
    port: PORT,
    historyApiFallback: true,
    public: 'www.sigobras.com',
    allowedHosts: [
      'www.sigobras.com',
      'sigobras.com',
      '190.117.94.80'
    ],
    filename: 'main.js'
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    })
  ]
};