'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//const nodetree = require('nodetree');
const Promise = require("bluebird");
//const copyAsync = Promise.promisify(require('fs-extra').copy);
const rimrafAsync = Promise.promisify(require("rimraf"));
const webpack = require("webpack");

// -------------------------------------------------------------------------------------------------

function start() {
  //console.log('>> pack()');
  //nodetree('/cargo', { all: true, level: 2 });
  const webpackConfig = require('/cargo/html/src/webpack.config.js')('static');
  const compiler = webpack(webpackConfig);
  return clean()
    .then(() => runCompiler(compiler));
    //.then((stats) => console.log('- stats:', stats));
}

function clean() {
  // Note: current working directory is /cargo/app
  return rimrafAsync('/cargo/html/dist/*')
    .catch((error) => {
      console.error('[cargo]', 'pack.js..clean() failed.', error);
      return error;
    });
}

function runCompiler(compiler) {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        console.error('pack failed.', error);
        reject(new Error('pack failed.', error));
      }
      else {
        console.log('pack complete.');
        resolve(stats);
      }
    });
  });
}

//function watch(compiler) {
//  const watchOpts = {
//    aggregateTimeout: 300, // wait so long for more changes
//    poll: 1000 // use polling instead of native watchers, set a number to set the polling interval
//  };
//  compiler.watch(watchOpts, (error, stats) => {
//    if (error) {
//      console.log('watch failed.', error);
//    }
//    else {
//      console.log('watch complete.');
//      //console.log('- stats:', stats);
//    }
//  })
//}

//function moveIndexFile(distDir) {
//  return copyAsync(`${distDir}/assets/index.html`, `${distDir}/index.html`)
//    .catch((error) => {
//      console.log('Failed to move index.html.', error);
//      throw new Error('Failed to move index.html.', error);
//    });
//}

// -------------------------------------------------------------------------------------------------

start();
