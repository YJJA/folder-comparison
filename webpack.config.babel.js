import webpack from 'webpack'
import path from 'path'
import packageJson from './package.json'

export default function webpackConfig(env) {
  return {
    entry: './src/folder-comparison.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'folder-comparison.js',
      libraryTarget: 'commonjs2'
    },
    resolve: {
      modules: ['node_modules']
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          loader: 'eslint-loader',
          exclude: /node_modules/
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        }
      ]
    },
    target: 'node',
    externals: Object.keys(packageJson.dependencies)
  }
}
