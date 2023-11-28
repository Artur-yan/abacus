/* eslint-disable global-require */

const _ = require('lodash');
const path = require('path');
const extend = require('extend');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const babel = require('./.babelrc.json');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isDebug = global.DEBUG === false ? false : !process.argv.includes('--release');
const isAnalyzeRel = process.argv.includes('--analyzerel');
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
const useHMR = !!global.HMR; // Hot Module Replacement (HMR)
const ASSET_PATH = process.env.ASSET_PATH || '';

const fs = require('fs');
const lessToJs = require('less-vars-to-js');
const themeVariables = lessToJs(fs.readFileSync(path.join(__dirname, './core/ant-theme-vars.less'), 'utf8'));

const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackManifestPlugin = require('webpack-manifest-plugin');
const minify = require('babel-minify');
const TerserPlugin = require('terser-webpack-plugin');
const { TypedCssModulesPlugin } = require('typed-css-modules-webpack-plugin');
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const APP_DIR = path.resolve(__dirname, './src');
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');
const PLOTLY_DIR = path.resolve(__dirname, './node_modules/jupyterlab-plotly');

const crypto = require('crypto');

const checksum = (str, algorithm = 'sha384', encoding = 'base64') => crypto.createHash(algorithm).update(str, 'utf8').digest(encoding);

const fileSum = (file, algorithm) => checksum(fs.readFileSync(file), algorithm);

const calculateSRI = (file, algorithm = 'sha384') => `${algorithm}-${fileSum(file /*path.join('.', 'dist', file)*/, algorithm)}`;

let babelA = {
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: extend({}, babel, {
      babelrc: false,
      cacheDirectory: useHMR,
    }),
  },
};

let babelB = {
  test: /\.jsx?$/,
  include: [path.resolve(__dirname, './src'), path.resolve(__dirname, './pages'), path.resolve(__dirname, './core'), path.resolve(__dirname, './main.js')],
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: extend({}, babel, {
      babelrc: false,
      cacheDirectory: useHMR,
    }),
  },
};

babelB.use.options.presets = babelB.use.options.presets.filter((preset) => preset !== '@babel/preset-typescript');

let devProxyUrl = process.env.RE_DEV_PROXY;
let devProxyUrlWS = process.env.RE_DEV_PROXY_WS;
if (!devProxyUrl && process.env.REAI_USER) {
  devProxyUrl = 'https://' + process.env.REAI_USER + '-dev.internalreai.com';
}
if (!devProxyUrlWS && process.env.REAI_USER) {
  devProxyUrlWS = 'https://ws-' + process.env.REAI_USER + '-dev.internalreai.com';
}
// const aws_host = { target: devProxyUrl, changeOrigin: true, };
let proxyModels = {
  context: ['/models/**'],
  target: 'http://localhost:4000',
  changeOrigin: true,
  proxyTimeout: 5 * 60 * 1000,
  onProxyReq: (proxyReq, req, res) => req.setTimeout(5 * 60 * 1000),
  timeout: 1000 * 60 * 10,
  secure: false,
};

let proxyList = [
  proxyModels,
  {
    context: ['/wsp/**'],
    target: devProxyUrlWS,
    changeOrigin: true,
    proxyTimeout: 5 * 60 * 1000,
    onProxyReq: (proxyReq, req, res) => req.setTimeout(5 * 60 * 1000),
    timeout: 1000 * 60 * 10,
    secure: false,
    pathRewrite: { '^/wsp': '' },
  },
  {
    context: ['**', '!/app/**'],
    target: devProxyUrl,
    changeOrigin: true,
    proxyTimeout: 5 * 60 * 1000,
    onProxyReq: (proxyReq, req, res) => req.setTimeout(5 * 60 * 1000),
    timeout: 1000 * 60 * 10,
    secure: false,
    headers: {
      'Abacus-Alt-Domain': 'aaa',
    },
  },
];

let dockerDevContext = {
  context: ['/static/**', '/help/**'],
  target: 'http://aaa.internalreai.com:8090',
  changeOrigin: true,
  proxyTimeout: 5 * 60 * 1000,
  onProxyReq: (proxyReq, req, res) => req.setTimeout(5 * 60 * 1000),
  timeout: 1000 * 60 * 10,
  secure: false,
};

if (process.env.USE_LOCAL_STATIC) {
  proxyList.unshift(dockerDevContext);
}

let proxys_aws = {
  proxy: proxyList,
};
if (!devProxyUrl) {
  proxys_aws = {
    proxy: [proxyModels],
  };
}

// Webpack configuration (main.js => public/dist/main.{hash}.js)
// http://webpack.github.io/docs/configuration.html
const config = {
  mode: isDebug ? 'development' : 'production',

  // The base directory for resolving the entry option
  context: __dirname,

  // The entry point for the bundle
  entry: ['./main.js'],

  devServer: {
    hot: true,
    port: 3000,
    compress: true,
    static: [path.join(__dirname, 'public/app'), path.join(__dirname, 'public')],
    historyApiFallback: {
      disableDotRule: true,
    },
    // host: 'localhost',
    // hotOnly: true,
    // disableHostCheck: true,
    allowedHosts: ['all'],
    https: {
      key: './ss/dev.key',
      cert: './ss/dev.crt',
    },
  },

  // Options affecting the output of the compilation
  output: {
    path: path.resolve(__dirname, './public/app/dist'),
    publicPath: /*(ASSET_PATH)+*/ '/app/dist/',
    filename: isDebug ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDebug ? '[name].js' : '[id].[chunkhash].js',
    sourcePrefix: '  ',
    globalObject: 'this',
  },
  //globalObject: `typeof self !== 'undefined' ? self : this`,

  // Switch loaders to debug or release mode
  // debug: isDebug,

  // Developer tool to enhance debugging, source maps
  // http://webpack.github.io/docs/configuration.html#devtool
  devtool: isDebug ? 'eval-source-map' : false,

  // What information should be printed to the console
  stats: {
    colors: true,
    reasons: isDebug,
    hash: isVerbose,
    version: isVerbose,
    timings: true,
    chunks: isVerbose,
    chunkModules: isVerbose,
    cached: isVerbose,
    cachedAssets: isVerbose,
  },

  watchOptions: {
    ignored: /node_modules/,
  },

  resolve: {
    fallback: {
      fs: false,
      net: false,
      tls: false,

      // stream: require.resolve("stream-browserify"),
      // crypto: require.resolve("crypto-browserify"),
      // http: require.resolve("stream-http"),
      // https: require.resolve("https-browserify"),
      // zlib: require.resolve("browserify-zlib"),
      // assert: require.resolve("assert"),
      // util: require.resolve("util"),
      // path: require.resolve("path-browserify"),
      // os: require.resolve("os-browserify"), // /browser
    },
    alias: {
      'styled-components': path.resolve(__dirname, 'node_modules', 'styled-components'),
      '@material-ui/styles': path.resolve(__dirname, 'node_modules', '@material-ui/styles'),
      react: path.resolve(__dirname, 'node_modules', 'react'),
      // "react-dom": path.resolve(__dirname, "node_modules", "react-dom"),
      'react-redux': path.resolve(__dirname, 'node_modules', 'react-redux'),
      // querystring: 'querystring-browser',
      // 'react-dom': '@hot-loader/react-dom',
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
  },

  plugins: [
    // new MomentLocalesPlugin(),
    // new MomentTimezoneDataPlugin({
    //   matchCountries: ['US', 'GB'],
    //   matchZones: [],
    // }),
    // new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /en/),
    // new webpack.ProvidePlugin({
    //   $: "jquery",
    //   jQuery: "jquery",
    //   'window.jQuery': 'jquery',
    //   'window.$': 'jquery'
    // }),
    new TypedCssModulesPlugin({
      globPattern: 'src/**/!(antd2)*.module.css',
    }),
    new webpack.LoaderOptionsPlugin({
      debug: isDebug,
    }),
    // new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      __DEV__: isDebug,
      'process.env.asset_path': JSON.stringify(ASSET_PATH),
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/index.ejs'), // path to your index.ejs
      templateParameters: {
        debug: isDebug,
        rddebug: isDebug ? 'window.isD = true;' : '',
        assetPath: ASSET_PATH,
      },
      alwaysWriteToDisk: true,
      filename: path.join(__dirname, 'public/app/index.html'),
      inject: true,
      minify: false,
    }),
    new HtmlWebpackHarddiskPlugin(),
    // Emit a JSON file with assets paths
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve(__dirname, './public/app/dist'),
      filename: 'assets.json',
      prettyPrint: true,
      entrypoints: true,
    }),

    new MonacoWebpackPlugin({
      publicPath: '/app/dist/',
      globalAPI: true,
      // languages: ['json', 'sql'],
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     {
    //       from: path.resolve(__dirname, "./node_modules/@hpcc-js/wasm/dist/graphvizlib.wasm"),
    //     },
    //   ],
    // }),
  ],

  // Options affecting the normal modules

  module: {
    noParse: [/aws-sdk/, /node_modules\/localforage\/dist\/localforage.js/],
    rules: [
      // {
      //   test: require.resolve("jquery"),
      //   use: [{
      //     loader: 'expose-loader',
      //     options: 'jQuery'
      //   },{
      //     loader: 'expose-loader',
      //     options: '$'
      //   }]
      // },
      {
        test: /\.sharedworker\.js$/,
        include: APP_DIR,
        exclude: /node_modules/,
        use: { loader: 'shared-worker-loader' },
      },
      {
        test: /\.worker\.js$/,
        include: APP_DIR,
        exclude: /node_modules/,
        use: {
          loader: 'worker-loader',
          options: {
            // inline: true,
            // publicPath: /*(ASSET_PATH)+*/'/app/dist/',
            // crossOrigin: true,
          },
        },
      },
      babelA,
      babelB,
      {
        test: /\.less$/,
        // include: [
        //   path.resolve(__dirname, 'node_modules'),
        // ],
        use: [
          {
            loader: 'style-loader',
            options: {
              esModule: false,
            },
          },
          {
            loader: 'css-loader',
            options: {
              // root: true,
              sourceMap: isDebug,
              // modules: true,
              // minimize: !isDebug,
            },
          },
          {
            loader: 'less-loader',
            options: {
              modifyVars: themeVariables,
              root: path.resolve(__dirname, './'),
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.module\.css$/,
        include: APP_DIR,
        use: [
          {
            loader: 'style-loader',
            options: {
              esModule: false,
            },
          },
          {
            loader: 'css-loader',
            options: {
              // root: true,
              sourceMap: isDebug,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: {
                localIdentName: isDebug ? '[name]_[local]_[contenthash:base64:3]' : '[contenthash:base64:4]',
              },
              // CSS Nano http://cssnano.co/options/
              // minimize: !isDebug,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-import',
                  'postcss-simple-vars',
                  'postcss-custom-media',
                  'postcss-media-minmax',
                  'postcss-custom-selectors',
                  'postcss-calc',
                  'postcss-nested',
                  'postcss-sass-color-functions',
                  'postcss-color-function',
                  'pleeease-filters',
                  'postcss-selector-matches',
                  'postcss-selector-not',
                  'autoprefixer',
                ],
              },
            },
          },
        ],
      },
      {
        // Not to match string ending with .mod.css and only match .css files
        test: /^(?!.*\.module\.css$).*\.css$/,
        include: [MONACO_DIR, PLOTLY_DIR, APP_DIR],
        use: ['style-loader', 'css-loader'],
        // use: [{
        //   loader: 'style-loader',
        //   options: {
        //     esModule: false,
        //   },
        // }, 'css-loader'],
      },
      {
        test: /\.scss$/,
        exclude: MONACO_DIR,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.json$/,
        use: ['json-loader'],
        type: 'javascript/auto',
        exclude: [path.resolve(__dirname, './routes.jsonr')],
        // loader: 'json-loader',
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: path.resolve(__dirname, './utils/markdown-loader.js'),
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader?limit=10000',
          },
        ],
      },
      {
        test: /\.(eot|ttf22|wav|mp3)$/,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ],
  },
};

if (proxys_aws /*devProxyUrl*/) {
  config.devServer.proxy = proxys_aws.proxy;
}

// Optimize the bundle in release (production) mode
if (!isDebug) {
  // config.plugins.push(new webpack.optimize.DedupePlugin());
  //react-intl-tel-input|

  config.optimization = {
    moduleIds: 'named',

    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        generalCommon: {
          test: /[\\/]node_modules[\\/](rd-field-form|chartist|rc-dialog|rc-trigger|@popperjs|immutable|reflux-core|@babel|styled-components|react-bootstrap|babel-runtime|react-redux|reflux|overlayscrollbars-react|overlayscrollbars|react-dnd|dnd-core|localforage|axios|bignumber|react-select|@ant-design|react-dom|@sentry|uuid|query-string|react-notification-system)[\\/]/,
          name: 'generalCommon',
          chunks: 'all',
          enforce: true,
        },
        generalCommon2: {
          test: /[\\/]node_modules[\\/](echarts|antd|@fortawesome|@material-ui|lodash|jquery|he)[\\/]/,
          name: 'generalCommon2',
          chunks: 'all',
          enforce: true,
        },
        generalCommon3: {
          test: /[\\/]node_modules[\\/](zrender|moment|moment-timezone|react-virtualized|rc-picker|rc-menu)[\\/]/,
          name: 'generalCommon3',
          chunks: 'all',
          enforce: true,
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        exclude: [/fontawesome.js/, /fontawesome.min.js/, /fontawesome-all.min.js/, /fontawesome-all.js/],
        parallel: true,
        // sourceMap: true,
        terserOptions: {
          safari10: true,
          output: {
            comments: false,
          },
          // mangle: {
          //   properties: {
          //     regex: /_$/
          //   },
          // },
        },
      }),
    ],
  };
  config.plugins.push(new webpack.optimize.AggressiveMergingPlugin());
  config.plugins.push(
    new webpack.SourceMapDevToolPlugin({
      filename: '../../../private/[file].map',
      append: isAnalyzeRel ? undefined : '\n//# sourceMappingURL=/app/dist/[file].map',
    }),
  );

  if (!isAnalyzeRel) {
    const SentryCliPlugin = require('@sentry/webpack-plugin');
    config.plugins.push(
      new SentryCliPlugin({
        include: ['./public/app/dist', './private'],
        ignore: ['node_modules', 'webpack.config.js'],
        urlPrefix: '~/app/dist',
        stripPrefix: ['public', 'private'],
      }),
    );
  }
}

// Hot Module Replacement (HMR) + React Hot Reload
if (isDebug && useHMR) {
  // config.entry.unshift('react-hot-loader/patch');

  [babelA, babelB].some((babel1) => {
    // if(babel1.use==null) {
    //   babel1.use = [];
    // }
    // babel1.use.unshift('react-hot-loader/webpack');
    // babel1.use.options.plugins.push('react-hot-loader/babel');
    babel1.use.options.plugins.push('react-refresh/babel');
  });

  // config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true));
  // config.plugins.push(new webpack.NamedModulesPlugin());
  config.plugins.push(new webpack.NoEmitOnErrorsPlugin());
  config.plugins.push(
    new ForkTsCheckerWebpackPlugin({
      async: true,
    }),
  );
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new ReactRefreshWebpackPlugin());
  config.cache = true;
}

module.exports = config;
