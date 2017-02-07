/*eslint-env node */

'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');
const autoprefixer = require('autoprefixer');
const resolve = require('path').resolve;
const postcss = require('postcss-loader');
const webpack = require('webpack');
const MaskedConfig = require('webpack-masked-config-plugin');

const { defaultOptions, validateOptions, mergeOptions, WebpackConfigOptions } = require('./configOptions');

// -------------------------------------------------------------------------------------------------

/**
 * @param {String} [mode = static] - Either 'static' or 'hot'.
 * @param {WebpackConfigOptions} options - See module:cargo-lib/html/configOptions
 * @returns {Object} A Webpack config object based on the given options, the default options,
 *          and the value of options.mode.
 */
function createConfig(mode, options) {
  assert(['static', 'hot'].includes(mode),
    `The mode parameter must be either 'static' or 'hot', instead got '${mode}'.`);

  options = mergeOptions(options, defaultOptions);
  validateOptions(options);

  process.env.BOOTSTRAPRC = '/cargo/cargo-lib/html/.bootstraprc';

  switch (mode) {
    case 'static': return developmentConfig(options);
    case 'hot': return hotMiddleWareConfig(options);
  }

  // if (mode === 'production') { return productionConfig(options); }
  //if (mode === 'watch') { return watchConfig(options); }
}

// -------------------------------------------------------------------------------------------------

function jsxLoaderSpec({ babelPresets, loadersInclude }) {
  return {
    test: /\.jsx?$/,
    loader: 'babel-loader',
    query: {
      presets: babelPresets,
      plugins: ['react-require', 'transform-class-properties']
    },
    include: loadersInclude
  };
}

// -------------------------------------------------------------------------------------------------

function baseConfig(opts) {
  const config = {};

  // Report the first error as a hard error instead of tolerating it.
  config.bail = true;

  // The entry points: All modules are loaded upon startup. The last one is exported.
  config.entry = {
    app: [ 'bootstrap-loader', '/cargo/html/src/main.jsx' ],
    vendor: opts.vendorModules
  };

  config.output = {
    path: opts.outputPath,
    publicPath: opts.publicPath,
    filename: 'bundle.js'
  };

  // Add resolve.extensions. The empty string is needed to allow imports without an extension.
  // Note that the dots before the extensions are required.
  config.resolve = {
    //alias: {
    //  'cargo-lib': '../../../../../cargo-base'
    //},
    extensions: ['', '.js', '.jsx'],
    root: opts.resolveRoot
  };

  /** @type Number - Embed assets smaller than this size. */
  const EMBED_FILE_SIZE = 32768;

  config.module = {
    // Note: loaders are called from right to left
    preLoaders: [
      {
        test: /\.css$/,
        // Note: style-loader is required for hot-module-reloading (HMR)
        loaders: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.scss$/,
        include: /src/,
        loaders: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
      },
      {
        test: /\.json$/,
        loaders: ['json-loader']
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loaders: ['file-loader']
      },
      {
        test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&minetype=application/font-woff`]
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=application/octet-stream`]
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=image/svg+xml`]
      },
      {
        test: /\.gif/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=image/gif`]
      },
      {
        test: /\.jpg/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=image/jpg`]
      },
      {
        test: /\.png/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=image/png`]
      },
      {
        test: /\.mp4/,
        loaders: [`url-loader?limit=${EMBED_FILE_SIZE}&mimetype=video/mp4`]
      }
    ],
    loaders: []
  };

  // Configure postcss - see https://github.com/postcss/postcss-loader
  // The context of this function will be set to the webpack loader-context. If there is the need,
  // this will let you access to webpack loaders API.
  config.postcss = function () {
    return [autoprefixer];
  };

  config.plugins = [
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js'),
    new MaskedConfig(opts.maskedConfig)
  ];

  return config;
}

// -------------------------------------------------------------------------------------------------

function developmentConfig(opts) {
  const config = baseConfig(opts);

  config.debug = false;  // Switch loaders to debug mode.
  config.devtool = 'eval';  // Each module is executed with eval and //@ sourceURL.

  config.module.preLoaders.push({
    test: /\.jsx?$/,
    loader: 'eslint-loader',
    include: opts.loadersInclude
  });
  config.eslint = opts.eslint;

  //console.log('- opts.babelPresets:', opts.babelPresets);
  const jsxLoader = jsxLoaderSpec(opts);
  jsxLoader.query.cacheDirectory = true;
  config.module.loaders.push(jsxLoader);

  return config;
}

/** @todo: Under construction */
//function watchConfig(opts) {
//  console.log('WebPack: using watchConfig');
//  const config = developmentConfig(opts);
//
//  config.plugins.push(
//    new require('watch-ignore-webpack-plugin')([opts.maskedConfig.target, opts.outputPath])
//  );
//  config.stats = { colors: true };
//  config.watchOptions = { poll: 1000 };
//
//  return config;
//}

/** @todo: Under construction */
//function hotConfig(opts) {
//  console.log('WebPack: using hotConfig');
//  const config = developmentConfig(opts);
//
//  config.stats = { colors: true };
//
//  // Add WebpackDevServer and react hot:
//  //config.entry.unshift('webpack/hot/only-dev-server');  // "only" prevents reload on syntax errors
//  config.entry.unshift('webpack-dev-server/client?http://localhost:8080');  // WebpackDevServer host and port
//  //config.devServer = {
//    //contentBase: "html/",
//    //noInfo: true,  // --no-info option
//    //hot: true,
//    //inline: true
//  //};
//
//  return config;
//}

/**
 * This config should only be used in development mode.
 * @param opts
 */
function hotMiddleWareConfig(opts) {
  console.log('WebPack: using hotMiddleWareConfig');
  if (process.env.NODE_ENV !== 'development') {
    console.error('The hotMiddleWareConfig should only be use in development mode.');
  }
  const WatchIgnorePlugin = require('watch-ignore-webpack-plugin');

  // Add preset (see https://github.com/danmartinez101/babel-preset-react-hmre) that adds the
  // Hot Module Reloading (HMR) React transform (see: https://github.com/gaearon/react-transform-hmr).
  // Note that 'react-hot-loader' is not needed when using this transform.
  // Warning! This doesn't currently work for stateless functional components that were introduced in React 0.14!
  // @todo: Replace with React Hot Loader 3 when it is sufficiently stable.
  opts.babelPresets = opts.babelPresets.concat('react-hmre');

  const config = developmentConfig(opts);

  // No hard exit when build fails in watch mode.
  config.bail = false;

  config.plugins.push(
    new WatchIgnorePlugin([opts.maskedConfig.target]),
    new webpack.optimize.OccurenceOrderPlugin(),  // ensures consistent build hashes
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()                  // handle errors more cleanly
  );

  config.entry.app.unshift('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&overlay=true&reload=true');

  return config;
}

// -------------------------------------------------------------------------------------------------

function productionConfig(opts) {
  console.log('WebPack: using productionConfig');
  const config = baseConfig(opts);

  config.devtool = 'source-map';  // A complete SourceMap is generated.

  config.module.loaders.push(jsxLoaderSpec(opts));

  config.plugins.push(new MaskedConfig(opts.maskedConfig));

  config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'main',       // Move dependencies to our main file
    children: true,     // Look for common dependencies in all children,
    minChunks: 2        // How many times a dependency must come up before being extracted
  }));

  // Looks for similar chunks and files and merges them for better caching by the user.
  config.plugins.push(new webpack.optimize.DedupePlugin());

  // Optimizes chunks and modules by how much they are used in your app.
  config.plugins.push(new webpack.optimize.OccurenceOrderPlugin());

  // Prevents Webpack from creating chunks too small to be worth loading separately.
  config.plugins.push(new webpack.optimize.MinChunkSizePlugin({minChunkSize: 51200}));

  // Minifies all the Javascript code of the final bundle.
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle: true,
    compress: {
      warnings: false // Suppress uglification warnings
    }
  }));

  config.plugins.push(require('webpack-visualizer-plugin')({ filename: 'visualizer.html' }));

  // Defines various variables that we can set to false in production to avoid code related to
  // them from being compiled in our final bundle.
  config.plugins.push(new webpack.DefinePlugin({
    __SERVER__: false,
    __DEVELOPMENT__: false,
    __DEVTOOLS__: false,
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      BABEL_ENV: JSON.stringify(process.env.NODE_ENV)
    }
  }));

  return config;
}

module.exports = createConfig;
