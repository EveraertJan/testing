'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const cargo = require('cargo-lib');
const log4js = require('log4js');

//const log = log4js.getLogger('App');

class App extends cargo.CargoApp {

  ///** @inheritdoc */
  //*onStart() {}

}

return new App({ disableAuth: true }).start();
