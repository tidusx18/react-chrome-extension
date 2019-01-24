module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        path: `${__dirname}/dist`,
        filename: 'popup.js'
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        }
      ]
    },
    devtool: 'source-map'
};